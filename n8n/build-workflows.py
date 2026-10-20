"""
Builds the n8n workflow files in this folder (A-draft-story.json, B-produce-episode.json, C-health-check.json).
Edit this file and run `python3 n8n/build-workflows.py` instead of hand-editing the JSON.

Node parameters follow n8n 2.x (n8n-nodes-base 2.15).
Credentials are not included: after importing, pick them in the nodes marked with a warning.
"""

import json
import os
import uuid

HERE = os.path.dirname(os.path.abspath(__file__))
NS = uuid.UUID("6f0c1f0e-7f6a-4d0c-9b1e-0f0f0f0f0f0f")


def uid(name: str) -> str:
    return str(uuid.uuid5(NS, name))


class Flow:
    def __init__(self, name: str):
        self.name = name
        self.nodes: list[dict] = []
        self.connections: dict = {}

    def node(self, name, type_, version, params, pos, **extra):
        n = {
            "parameters": params,
            "id": uid(f"{self.name}/{name}"),
            "name": name,
            "type": type_,
            "typeVersion": version,
            "position": pos,
        }
        n.update(extra)
        self.nodes.append(n)
        return name

    def link(self, a, b, out=0, inp=0):
        outs = self.connections.setdefault(a, {"main": []})["main"]
        while len(outs) <= out:
            outs.append([])
        outs[out].append({"node": b, "type": "main", "index": inp})

    def chain(self, *names):
        for a, b in zip(names, names[1:]):
            self.link(a, b)

    def save(self, file):
        data = {
            "name": self.name,
            "nodes": self.nodes,
            "connections": self.connections,
            "settings": {"executionOrder": "v1", "timezone": "Asia/Bangkok"},
            "pinData": {},
            "meta": {"templateCredsSetupCompleted": False},
        }
        with open(os.path.join(HERE, file), "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            f.write("\n")
        print(f"  + n8n/{file}  ({len(self.nodes)} nodes)")


# ───────────── node helpers ─────────────

S = "$('Settings').first().json"


def settings(f: Flow, pos, extra=None):
    values = {
        "workerBase": "http://host.docker.internal:4310",
        "telegramChatId": "PUT_YOUR_TELEGRAM_CHAT_ID",
    }
    values.update(extra or {})
    return f.node(
        "Settings",
        "n8n-nodes-base.set",
        3.4,
        {
            "assignments": {
                "assignments": [
                    {"id": uid(f"{f.name}/settings/{k}"), "name": k, "value": v, "type": "string"} for k, v in values.items()
                ]
            },
            "options": {},
        },
        pos,
        notes="Edit these values after importing",
    )


def worker(f: Flow, name, method, path_expr, pos, body_expr=None, file_out=None):
    """HTTP call to the Studio Worker with the Header Auth credential (Authorization: Bearer <WORKER_TOKEN>)."""
    p = {
        "method": method,
        "url": f"={{{{ {S}.workerBase }}}}{path_expr}",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "options": {},
    }
    if body_expr is not None:
        p.update({"sendBody": True, "specifyBody": "json", "jsonBody": body_expr})
    if file_out:
        p["options"] = {"response": {"response": {"responseFormat": "file", "outputPropertyName": file_out}}}
    return f.node(name, "n8n-nodes-base.httpRequest", 4.2, p, pos)


def download(f: Flow, name, url_expr, prop, pos):
    """Download a file from the worker; keeps the incoming JSON and adds binary[prop]."""
    return f.node(
        name,
        "n8n-nodes-base.httpRequest",
        4.2,
        {
            "url": url_expr,
            "authentication": "genericCredentialType",
            "genericAuthType": "httpHeaderAuth",
            "options": {"response": {"response": {"responseFormat": "file", "outputPropertyName": prop}}},
        },
        pos,
    )


def wait_callback(f: Flow, name, pos):
    """Pauses until the worker POSTs the finished job to $execution.resumeUrl."""
    return f.node(
        name,
        "n8n-nodes-base.wait",
        1.1,
        {"resume": "webhook", "httpMethod": "POST", "options": {}},
        pos,
        webhookId=uid(f"{f.name}/{name}/webhook"),
    )


def if_node(f: Flow, name, left, operator, pos, right=None):
    cond = {"id": uid(f"{f.name}/{name}/c"), "leftValue": left, "operator": operator}
    if right is not None:
        cond["rightValue"] = right
    return f.node(
        name,
        "n8n-nodes-base.if",
        2.2,
        {
            "conditions": {
                "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "loose", "version": 2},
                "conditions": [cond],
                "combinator": "and",
            },
            "looseTypeValidation": True,
            "options": {},
        },
        pos,
    )


def job_ok(f: Flow, name, wait_name, pos):
    return if_node(
        f, name, f"={{{{ $('{wait_name}').first().json.body.status }}}}",
        {"type": "string", "operation": "equals"}, pos, right="done",
    )


def approved(f: Flow, name, pos):
    return if_node(f, name, "={{ $json.data.approved }}", {"type": "boolean", "operation": "true", "singleValue": True}, pos)


def tg_text(f: Flow, name, text, pos):
    return f.node(
        name,
        "n8n-nodes-base.telegram",
        1.2,
        {"chatId": f"={{{{ {S}.telegramChatId }}}}", "text": text, "additionalFields": {"appendAttribution": False}},
        pos,
        webhookId=uid(f"{f.name}/{name}/wh"),
    )


def tg_ask(f: Flow, name, message, pos, yes="อนุมัติ", no="ไม่อนุมัติ"):
    return f.node(
        name,
        "n8n-nodes-base.telegram",
        1.2,
        {
            "operation": "sendAndWait",
            "chatId": f"={{{{ {S}.telegramChatId }}}}",
            "message": message,
            "approvalOptions": {"values": {"approvalType": "double", "approveLabel": yes, "disapproveLabel": no}},
            "options": {"appendAttribution": False},
        },
        pos,
        webhookId=uid(f"{f.name}/{name}/wh"),
    )


def tg_file(f: Flow, name, op, caption, pos):
    return f.node(
        name,
        "n8n-nodes-base.telegram",
        1.2,
        {
            "operation": op,
            "chatId": f"={{{{ {S}.telegramChatId }}}}",
            "binaryData": True,
            "binaryPropertyName": "data",
            "additionalFields": {"caption": caption},
        },
        pos,
        webhookId=uid(f"{f.name}/{name}/wh"),
    )


def code(f: Flow, name, js, pos):
    return f.node(name, "n8n-nodes-base.code", 2, {"jsCode": js}, pos)


def job_error_text(wait_name):
    return (
        f"=❌ งาน {{{{ $('{wait_name}').first().json.body.type }}}} ไม่สำเร็จ\n"
        f"{{{{ $('{wait_name}').first().json.body.error }}}}\n\n"
        f"log:\n{{{{ ($('{wait_name}').first().json.body.log || []).slice(-6).join('\\n') }}}}"
    )


# ───────────── A. draft a new story ─────────────

def build_a():
    f = Flow("Fufu A · ร่างบทนิทานใหม่")
    form = f.node(
        "Form: นิทานเรื่องใหม่",
        "n8n-nodes-base.formTrigger",
        2.2,
        {
            "formTitle": "ร่างบทนิทานใหม่ · Fufu Tales",
            "formDescription": "Claude จะร่างบท EN/TH ให้ แล้วส่งให้ตรวจใน Telegram",
            "formFields": {
                "values": [
                    {"fieldLabel": "ชื่อนิทาน", "placeholder": "เช่น แม่โพสพ", "requiredField": True},
                    {"fieldLabel": "เรื่องย่อ", "fieldType": "textarea", "placeholder": "เล่าเนื้อเรื่องคร่าวๆ ภาษาอะไรก็ได้"},
                    {"fieldLabel": "ข้อคิดที่ต้องการ", "placeholder": "เช่น ให้รู้คุณค่าของข้าว"},
                    {"fieldLabel": "หมายเหตุ", "fieldType": "textarea", "placeholder": "ฉากที่อยากตัด โทนเรื่อง ฯลฯ"},
                ]
            },
            "options": {},
        },
        [0, 300],
        webhookId=uid("A/form"),
    )
    st = settings(f, [220, 300])
    start = worker(
        f, "Worker: เริ่มร่างบท", "POST", "/stories/draft", [440, 300],
        body_expr=(
            "={{ JSON.stringify({ title: $('Form: นิทานเรื่องใหม่').first().json['ชื่อนิทาน'], "
            "synopsis: $('Form: นิทานเรื่องใหม่').first().json['เรื่องย่อ'], "
            "moral: $('Form: นิทานเรื่องใหม่').first().json['ข้อคิดที่ต้องการ'], "
            "notes: $('Form: นิทานเรื่องใหม่').first().json['หมายเหตุ'], "
            "callbackUrl: $execution.resumeUrl }) }}"
        ),
    )
    wait = wait_callback(f, "รอบทเสร็จ", [660, 300])
    ok = job_ok(f, "ร่างสำเร็จ?", "รอบทเสร็จ", [880, 300])
    fail = tg_text(f, "แจ้ง: ร่างไม่สำเร็จ", job_error_text("รอบทเสร็จ"), [1100, 480])
    ask = tg_ask(
        f, "ถาม: อนุมัติบท?",
        "={{ $('รอบทเสร็จ').first().json.body.result.preview }}\n\n"
        "{{ ($('รอบทเสร็จ').first().json.body.result.warnings || []).length ? '⚠️ ' + $('รอบทเสร็จ').first().json.body.result.warnings.length + ' ข้อควรดู (ภาษาไม่ครบ/ประโยคยาว)' : '' }}",
        [1100, 220],
    )
    yes = approved(f, "อนุมัติ?", [1320, 220])
    save = worker(
        f, "Worker: ตั้งสถานะ approved", "POST",
        "/stories/{{ $('รอบทเสร็จ').first().json.body.result.storyId }}/status", [1540, 140],
        body_expr='={"status": "approved"}',
    )
    done = tg_text(
        f, "แจ้ง: พร้อมผลิต",
        "=✅ อนุมัติบท {{ $('รอบทเสร็จ').first().json.body.result.storyId }} แล้ว\n"
        "{{ ($('รอบทเสร็จ').first().json.body.result.assetRequests || []).length ? '🎨 ต้องวาดเพิ่มก่อนผลิต:\\n• ' + $('รอบทเสร็จ').first().json.body.result.assetRequests.join('\\n• ') : 'ใช้ workflow B ผลิตตอนได้เลย' }}",
        [1760, 140],
    )
    keep = tg_text(
        f, "แจ้ง: เก็บเป็น draft",
        "=📝 เก็บบทไว้เป็น draft ที่ src/stories/{{ $('รอบทเสร็จ').first().json.body.result.storyId }}.json\nแก้ใน VS Code หรือสั่งร่างใหม่ได้",
        [1540, 320],
    )
    f.chain(form, st, start, wait, ok)
    f.link(ok, ask, 0)
    f.link(ok, fail, 1)
    f.link(ask, yes)
    f.link(yes, save, 0)
    f.link(yes, keep, 1)
    f.link(save, done)
    f.save("A-draft-story.json")


# ───────────── B. produce an episode ─────────────

def build_b():
    f = Flow("Fufu B · ผลิตตอนและอัปโหลด")
    form = f.node(
        "Form: ผลิตตอน",
        "n8n-nodes-base.formTrigger",
        2.2,
        {
            "formTitle": "ผลิตตอน · Fufu Tales",
            "formDescription": "สร้างเสียง → ภาพตรวจ → เรนเดอร์ → อัปโหลด YouTube (Private) มีจุดอนุมัติใน Telegram",
            "formFields": {
                "values": [
                    {"fieldLabel": "Story id", "placeholder": "rabbit-in-the-moon", "requiredField": True},
                    {
                        "fieldLabel": "ภาษา",
                        "fieldType": "dropdown",
                        "fieldOptions": {"values": [{"option": "th"}, {"option": "en"}]},
                        "multiselect": True,
                        "requiredField": True,
                    },
                    {
                        "fieldLabel": "ทำ Shorts ด้วย",
                        "fieldType": "dropdown",
                        "fieldOptions": {"values": [{"option": "ใช่"}, {"option": "ไม่"}]},
                        "requiredField": True,
                    },
                ]
            },
            "options": {},
        },
        [0, 400],
        webhookId=uid("B/form"),
    )
    st = settings(f, [200, 400], {"sheetId": "PUT_GOOGLE_SHEET_ID", "sheetName": "uploads", "regionCode": "TH"})
    params = code(
        f, "เตรียมค่า",
        "const form = $('Form: ผลิตตอน').first().json;\n"
        "const langs = [].concat(form['ภาษา'] || []).filter(Boolean);\n"
        "return [{ json: {\n"
        "  story: String(form['Story id']).trim(),\n"
        "  langs: langs.length ? langs : ['th', 'en'],\n"
        "  formats: form['ทำ Shorts ด้วย'] === 'ไม่' ? ['long'] : ['long', 'short'],\n"
        "} }];",
        [400, 400],
    )
    P = "$('เตรียมค่า').first().json"

    # 1. voices
    tts = worker(f, "Worker: สร้างเสียง", "POST", "/jobs", [600, 400],
                 body_expr=f"={{{{ JSON.stringify({{ type: 'tts', story: {P}.story, langs: {P}.langs, callbackUrl: $execution.resumeUrl }}) }}}}")
    w_tts = wait_callback(f, "รอเสียงเสร็จ", [800, 400])
    ok_tts = job_ok(f, "เสียงสำเร็จ?", "รอเสียงเสร็จ", [1000, 400])
    err_tts = tg_text(f, "แจ้ง: เสียงพัง", job_error_text("รอเสียงเสร็จ"), [1200, 560])

    # 2. review stills
    stills = worker(f, "Worker: ภาพนิ่งทุกฉาก", "POST", "/jobs", [1200, 400],
                    body_expr=f"={{{{ JSON.stringify({{ type: 'stills', story: {P}.story, lang: {P}.langs[0], callbackUrl: $execution.resumeUrl }}) }}}}")
    w_stills = wait_callback(f, "รอภาพนิ่ง", [1400, 400])
    ok_stills = job_ok(f, "ภาพนิ่งสำเร็จ?", "รอภาพนิ่ง", [1600, 400])
    err_stills = tg_text(f, "แจ้ง: ภาพนิ่งพัง", job_error_text("รอภาพนิ่ง"), [1800, 560])
    still_items = code(
        f, "รายการภาพนิ่ง",
        "return $('รอภาพนิ่ง').first().json.body.outputs.map((o) => ({ json: o, pairedItem: 0 }));",
        [1800, 400],
    )
    dl_still = download(f, "โหลดภาพนิ่ง", "={{ $json.url }}", "data", [2000, 400])
    send_still = tg_file(f, "ส่งภาพนิ่ง", "sendPhoto", "={{ $json.scene }}", [2200, 400])
    one1 = code(f, "รวมเป็นรายการเดียว 1", "return [{ json: { count: $input.all().length }, pairedItem: 0 }];", [2400, 400])
    ask_stills = tg_ask(f, "ถาม: ภาพโอเคไหม?",
                        f"=🖼 ภาพ {{{{ $json.count }}}} ฉากของ {{{{ {P}.story }}}} ด้านบน\nโอเคแล้วเรนเดอร์คลิปเต็มเลยไหม?",
                        [2600, 400], yes="เรนเดอร์เลย", no="ยังก่อน")
    yes_stills = approved(f, "เรนเดอร์?", [2800, 400])
    stop1 = tg_text(f, "แจ้ง: หยุดที่ภาพนิ่ง", f"=⏸ หยุดไว้ก่อน แก้บทหรือฉากของ {{{{ {P}.story }}}} แล้วสั่ง workflow B ใหม่", [3000, 560])

    # 3. render
    render = worker(f, "Worker: เรนเดอร์", "POST", "/jobs", [3000, 400],
                    body_expr=f"={{{{ JSON.stringify({{ type: 'render', story: {P}.story, langs: {P}.langs, formats: {P}.formats, callbackUrl: $execution.resumeUrl }}) }}}}")
    w_render = wait_callback(f, "รอเรนเดอร์", [3200, 400])
    ok_render = job_ok(f, "เรนเดอร์สำเร็จ?", "รอเรนเดอร์", [3400, 400])
    err_render = tg_text(f, "แจ้ง: เรนเดอร์พัง", job_error_text("รอเรนเดอร์"), [3600, 560])
    preview_items = code(
        f, "รายการพรีวิว",
        "// Telegram bots can send files up to 50 MB: send thumbnails and Shorts, not the long videos\n"
        "return $('รอเรนเดอร์').first().json.body.outputs\n"
        "  .filter((o) => o.kind === 'image' || (o.format === 'vertical' && (o.bytes || 0) < 48e6))\n"
        "  .map((o) => ({ json: o, pairedItem: 0 }));",
        [3600, 400],
    )
    dl_prev = download(f, "โหลดพรีวิว", "={{ $json.url }}", "data", [3800, 400])
    is_video = if_node(f, "เป็นวิดีโอ?", "={{ $json.kind }}", {"type": "string", "operation": "equals"}, [4000, 400], right="video")
    send_vid = tg_file(f, "ส่ง Shorts", "sendVideo", "={{ $json.youtube.title }}", [4200, 320])
    send_img = tg_file(f, "ส่ง Thumbnail", "sendPhoto", "=Thumbnail {{ $json.lang }}", [4200, 480])
    one2 = code(f, "รวมเป็นรายการเดียว 2", "return [{ json: { count: $input.all().length }, pairedItem: 0 }];", [4400, 400])
    ask_up = tg_ask(
        f, "ถาม: อัปโหลดไหม?",
        f"=🎬 เรนเดอร์ {{{{ {P}.story }}}} เสร็จแล้ว ({{{{ $('รอเรนเดอร์').first().json.body.outputs.filter(o => o.kind === 'video').length }}}} คลิป)\n"
        "อัปโหลดขึ้น YouTube แบบ Private + Made for Kids เลยไหม?\n(คลิปยาวดูได้ใน YouTube Studio หลังอัปโหลด)",
        [4600, 400], yes="อัปโหลด", no="ยังก่อน",
    )
    yes_up = approved(f, "อัปโหลด?", [4800, 400])
    stop2 = tg_text(f, "แจ้ง: ไม่อัปโหลด", "=⏸ ไม่อัปโหลด ไฟล์อยู่ในโฟลเดอร์ out/ ของโปรเจกต์", [5000, 560])

    # 4. upload
    up_items = code(
        f, "รายการอัปโหลด",
        "return $('รอเรนเดอร์').first().json.body.outputs\n"
        "  .filter((o) => o.kind === 'video')\n"
        "  .map((o) => ({ json: o, pairedItem: 0 }));",
        [5000, 400],
    )
    dl_vid = download(f, "โหลดวิดีโอ", "={{ $json.url }}", "data", [5200, 400])
    yt = f.node(
        "YouTube: อัปโหลด",
        "n8n-nodes-base.youTube",
        1,
        {
            "resource": "video",
            "operation": "upload",
            "title": "={{ $json.youtube.title }}",
            "regionCode": f"={{{{ {S}.regionCode }}}}",
            "categoryId": "={{ $json.youtube.categoryId }}",
            "binaryProperty": "data",
            "options": {
                "defaultLanguage": "={{ $json.youtube.defaultLanguage }}",
                "description": "={{ $json.youtube.description }}",
                "embeddable": True,
                "notifySubscribers": False,
                "privacyStatus": "private",
                "selfDeclaredMadeForKids": True,
                "tags": "={{ $json.youtube.tags.join(',') }}",
            },
        },
        [5400, 400],
    )
    has_thumb = if_node(f, "มี Thumbnail?", "={{ $('รายการอัปโหลด').item.json.thumbnailUrl }}",
                        {"type": "string", "operation": "notEmpty", "singleValue": True}, [5600, 400])
    dl_thumb = download(f, "โหลด Thumbnail", "={{ $('รายการอัปโหลด').item.json.thumbnailUrl }}", "thumb", [5800, 320])
    set_thumb = f.node(
        "YouTube: ตั้ง Thumbnail",
        "n8n-nodes-base.httpRequest",
        4.2,
        {
            "method": "POST",
            "url": "https://www.googleapis.com/upload/youtube/v3/thumbnails/set",
            "authentication": "predefinedCredentialType",
            "nodeCredentialType": "youTubeOAuth2Api",
            "sendQuery": True,
            "queryParameters": {"parameters": [{"name": "videoId", "value": "={{ $('YouTube: อัปโหลด').item.json.uploadId }}"}]},
            "sendBody": True,
            "contentType": "binaryData",
            "inputDataFieldName": "thumb",
            "options": {},
        },
        [6000, 320],
        onError="continueRegularOutput",
        notes="Fails until the channel is phone-verified; the upload still counts.",
    )
    row = f.node(
        "แถวบันทึก",
        "n8n-nodes-base.set",
        3.4,
        {
            "mode": "manual",
            "assignments": {
                "assignments": [
                    {"id": uid("B/row/date"), "name": "date", "value": "={{ $now.setZone('Asia/Bangkok').toFormat('yyyy-MM-dd HH:mm') }}", "type": "string"},
                    {"id": uid("B/row/story"), "name": "story", "value": "={{ $('รายการอัปโหลด').item.json.storyId }}", "type": "string"},
                    {"id": uid("B/row/lang"), "name": "lang", "value": "={{ $('รายการอัปโหลด').item.json.lang }}", "type": "string"},
                    {"id": uid("B/row/format"), "name": "format", "value": "={{ $('รายการอัปโหลด').item.json.format === 'vertical' ? 'short' : 'long' }}", "type": "string"},
                    {"id": uid("B/row/title"), "name": "title", "value": "={{ $('รายการอัปโหลด').item.json.youtube.title }}", "type": "string"},
                    {"id": uid("B/row/url"), "name": "youtube", "value": "=https://youtu.be/{{ $('YouTube: อัปโหลด').item.json.uploadId }}", "type": "string"},
                    {"id": uid("B/row/status"), "name": "status", "value": "private", "type": "string"},
                ]
            },
            "options": {},
        },
        [6200, 400],
    )
    sheet = f.node(
        "Google Sheets: บันทึก",
        "n8n-nodes-base.googleSheets",
        4.5,
        {
            "operation": "append",
            "documentId": {"__rl": True, "mode": "id", "value": f"={{{{ {S}.sheetId }}}}"},
            "sheetName": {"__rl": True, "mode": "name", "value": f"={{{{ {S}.sheetName }}}}"},
            "columns": {"mappingMode": "autoMapInputData", "value": {}, "matchingColumns": [], "schema": []},
            "options": {},
        },
        [6400, 400],
        onError="continueRegularOutput",
        notes="Sheet needs a header row: date, story, lang, format, title, youtube, status",
    )
    summary = code(
        f, "สรุปลิงก์",
        "const rows = $('แถวบันทึก').all().map((i) => `• ${i.json.lang} ${i.json.format}: ${i.json.youtube}`);\n"
        "return [{ json: { text: rows.join('\\n') }, pairedItem: 0 }];",
        [6600, 400],
    )
    done = tg_text(
        f, "แจ้ง: อัปโหลดเสร็จ",
        f"=✅ อัปโหลด {{{{ {P}.story }}}} แล้ว (Private)\n{{{{ $json.text }}}}\n\nเข้า YouTube Studio ดูคลิปยาว แล้วกด Public หรือตั้งเวลาเผยแพร่",
        [6800, 400],
    )

    f.chain(form, st, params, tts, w_tts, ok_tts)
    f.link(ok_tts, stills, 0)
    f.link(ok_tts, err_tts, 1)
    f.chain(stills, w_stills, ok_stills)
    f.link(ok_stills, still_items, 0)
    f.link(ok_stills, err_stills, 1)
    f.chain(still_items, dl_still, send_still, one1, ask_stills, yes_stills)
    f.link(yes_stills, render, 0)
    f.link(yes_stills, stop1, 1)
    f.chain(render, w_render, ok_render)
    f.link(ok_render, preview_items, 0)
    f.link(ok_render, err_render, 1)
    f.chain(preview_items, dl_prev, is_video)
    f.link(is_video, send_vid, 0)
    f.link(is_video, send_img, 1)
    f.link(send_vid, one2)
    f.link(send_img, one2)
    f.chain(one2, ask_up, yes_up)
    f.link(yes_up, up_items, 0)
    f.link(yes_up, stop2, 1)
    f.chain(up_items, dl_vid, yt, has_thumb)
    f.link(has_thumb, dl_thumb, 0)
    f.link(has_thumb, row, 1)
    f.chain(dl_thumb, set_thumb, row)
    f.chain(row, sheet, summary, done)
    f.save("B-produce-episode.json")


# ───────────── C. health check ─────────────

def build_c():
    f = Flow("Fufu C · เฝ้าระบบ")
    cron = f.node(
        "ทุก 30 นาที",
        "n8n-nodes-base.scheduleTrigger",
        1.2,
        {"rule": {"interval": [{"field": "minutes", "minutesInterval": 30}]}},
        [0, 300],
    )
    st = settings(f, [200, 300])
    h = worker(f, "Worker: health", "GET", "/health", [400, 300])
    f.nodes[-1]["onError"] = "continueErrorOutput"
    stuck = if_node(f, "งานค้างนานไหม?", "={{ $json.runningMinutes }}", {"type": "number", "operation": "gt"}, [620, 220], right=90)
    tg_stuck = tg_text(
        f, "แจ้ง: งานค้าง",
        "=⚠️ งาน {{ $json.running.type }} ของ {{ $json.running.story }} รันมา {{ $json.runningMinutes }} นาทีแล้ว\nเช็กเครื่องว่าหลับหรือ worker ค้างไหม",
        [840, 160],
    )
    tg_down = tg_text(f, "แจ้ง: Worker ไม่ตอบ", "=🚨 Studio Worker ไม่ตอบ\n{{ $json.error?.message || $json.error || '' }}\nเปิดเครื่องแล้วรัน npm run worker", [620, 420])
    f.chain(cron, st, h)
    f.link(h, stuck, 0)
    f.link(h, tg_down, 1)
    f.link(stuck, tg_stuck, 0)
    f.save("C-health-check.json")


if __name__ == "__main__":
    print("Workflows")
    build_a()
    build_b()
    build_c()
