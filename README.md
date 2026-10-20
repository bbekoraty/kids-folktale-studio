# Fufu Tales — นิทานฟูฟู

ระบบผลิตคลิปนิทานพื้นบ้านไทยสำหรับเด็ก หลายภาษา โดยมี **ฟูฟู (Fufu)** เป็นผู้เล่าประจำช่อง
สร้างด้วย [Remotion](https://www.remotion.dev) (React → วิดีโอ) ตัวละครทุกตัวเป็น SVG แยกชิ้น จึงหน้าตาเหมือนเดิมทุกตอน

## เริ่มใช้งาน

ต้องมี Node.js 20 ขึ้นไป

```bash
npm install
cp .env.example .env      # ใส่ API key ของ TTS
npm run dev               # เปิด Remotion Studio ดูตัวอย่างในเบราว์เซอร์
```

ยังไม่มีเสียงก็ดูตัวอย่างได้ ระบบประมาณความยาวจากจำนวนตัวอักษร และให้ปากขยับแบบจำลองไปก่อน

## ขั้นตอนผลิต 1 ตอน

```bash
npm run tts -- --story rabbit-in-the-moon          # สร้างเสียงทุกภาษา
npm run dev                                         # ตรวจภาพ เสียง ซับไตเติล
npm run render -- --story rabbit-in-the-moon        # เรนเดอร์ 16:9 + Shorts 9:16 ทุกภาษา
```

ไฟล์วิดีโอจะอยู่ในโฟลเดอร์ `out/`

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `npm run tts -- --story <id> --lang th` | สร้างเสียงเฉพาะภาษา (บรรทัดที่ไม่เปลี่ยนจะข้าม ไม่เสียเงินซ้ำ) |
| `npm run voices -- --lang th` | ทดลองฟังเสียง Chirp 3 HD ทั้ง 30 เสียง แล้วเปิด `out/voices/th/index.html` เลือกเสียง |
| `npm run music` | สร้างดนตรีประกอบและเสียงเอฟเฟกต์ใหม่ (ต้องมี Python + numpy + scipy + ffmpeg) |
| `npm run tts -- --story <id> --provider elevenlabs --force` | เปลี่ยนผู้ให้บริการเสียง และสร้างใหม่ทั้งหมด |
| `npm run render -- --story <id> --lang en --short` | เรนเดอร์เฉพาะ Shorts ภาษาเดียว |
| `npm run still -- <composition-id> 120 900` | เรนเดอร์ภาพนิ่งเพื่อตรวจฉาก |
| `npm run typecheck` | ตรวจโค้ด |

## โครงสร้างโปรเจกต์

```
src/stories/*.json        บทนิทาน 1 ไฟล์ต่อ 1 เรื่อง (ฉาก ตัวละคร ข้อความทุกภาษา)
src/characters/           ตัวละคร SVG: Fufu, Animals, People
src/scenes/               ฉากหลัง พร็อพ ซับไตเติล การ์ดชื่อเรื่อง
src/config/languages.ts   รายการภาษา
src/config/palette.ts     ชุดสีของช่อง
config/voices.json        เสียง TTS ต่อภาษา ต่อตัวละคร
public/audio/             ไฟล์เสียงที่ TTS สร้าง (+ manifest.json เก็บความยาว)
scripts/                  tts / render / still
```

## เพิ่มนิทานเรื่องใหม่

1. คัดลอก `src/stories/rabbit-in-the-moon.json` เป็นไฟล์ใหม่ แก้ `id` ฉาก และบท
2. ลงทะเบียนใน `src/stories/index.ts`
3. ถ้าต้องใช้ตัวละครหรือฉากหลังใหม่ เพิ่มใน `src/characters/` หรือ `src/scenes/Backgrounds.tsx`
4. `npm run tts` แล้ว `npm run dev`

กฎเขียนบท: เล่าแบบสรุป ประโยคสั้น ฉากรุนแรงให้นุ่มนวล ไม่แสดงความตายหรือการทำร้าย และจบด้วยข้อคิด 1 ประโยค

## เพิ่มภาษา

1. เพิ่มภาษาใน `src/config/languages.ts`
2. เพิ่มข้อความภาษานั้นในทุกบรรทัดของบท (ภาษาที่ขาดจะใช้ภาษาอังกฤษแทน)
3. เพิ่มเสียงใน `config/voices.json`
4. เพิ่มคำบนจอใน `src/config/ui.ts`

## ดนตรีประกอบ เอฟเฟกต์ และการเปลี่ยนฉาก

- ดนตรีและเสียงเอฟเฟกต์ทั้งหมดสร้างจากโค้ด (`scripts/music/generate.py`) ไม่ใช้ไฟล์เสียงของคนอื่น จึงไม่ติดลิขสิทธิ์หรือ Content ID
- เครื่องดนตรีเลียนแบบวงไทย: ระนาด ฆ้องวง ขิม ฉิ่ง โทน ใช้บันไดเสียงเพนทาโทนิก
- เพลงเลือกตามฉากหลังอัตโนมัติ (`src/config/music.ts`) เช่น ป่ากลางวัน → `day`, คืนพระจันทร์ → `night` หรือกำหนดเองในบทด้วย `"music": "magic"`
- เพลงจะลดเสียงลงเองตอนมีคนพูด (ducking) ปรับระดับได้ใน `MIX`
- การเปลี่ยนฉาก: เมฆเลื่อนผ่าน (`cloud`), วงกลมขยาย (`iris`), วงกลมประกายดาว (`sparkle`) เลือกอัตโนมัติ หรือกำหนดในบทด้วย `"transition": "iris"`

## TTS

- **Google Cloud TTS** (ค่าเริ่มต้น): เปิด Text-to-Speech API แล้วสร้าง API key ใส่ `GOOGLE_TTS_API_KEY`
  ใช้เสียง **Chirp 3 HD** ที่เป็นธรรมชาติกว่าเสียง Standard มาก ตัวละครแต่ละตัวใช้เสียงต่างกัน ตั้งค่าใน `config/voices.json`
  ใส่ `...` ในบทเพื่อให้ผู้เล่าเว้นจังหวะหายใจ
- **ElevenLabs**: ใส่ `ELEVENLABS_API_KEY` และ voice id ใน `config/voices.json`
  ตรวจว่าโมเดลที่เลือก (`ELEVENLABS_MODEL_ID`) รองรับภาษาไทยก่อนใช้

## หมายเหตุ

- ช่องเด็กต้องตั้งค่า **Made for Kids** ตอนอัปโหลด
- เพลงประกอบต้องมีไลเซนส์ (เช่น YouTube Audio Library) วางไว้ใน `public/music/`

## อัตโนมัติด้วย n8n

ภาพรวมและเหตุผลการออกแบบอยู่ในเอกสาร "Workflow อัตโนมัติ n8n — Fufu Tales" ส่วนนี้สรุปเฉพาะวิธีใช้

**Studio Worker** (`npm run worker`) คือ HTTP API ที่ n8n เรียกเพื่อสั่งงานหนัก ทุก request ต้องมี `Authorization: Bearer <WORKER_TOKEN>`

| Method | Path | ใช้ทำอะไร |
| --- | --- | --- |
| GET | `/health` | สถานะ worker และงานที่กำลังรัน |
| GET | `/stories` | รายชื่อนิทาน สถานะ ภาษาที่มีเสียงแล้ว |
| GET | `/stories/:id` | บทเต็ม + ผลตรวจ (`?preview=th` ได้ข้อความย่อ) |
| POST | `/stories/draft` | `{title, synopsis, moral, notes, callbackUrl}` ให้ Claude ร่างบท |
| POST | `/stories/:id/status` | `{status: "draft" \| "approved" \| "published"}` |
| POST | `/jobs` | `{type: "tts" \| "stills" \| "render" \| "thumbnail", story, langs, lang, formats, callbackUrl}` |
| GET | `/jobs`, `/jobs/:id` | รายการงาน / สถานะงาน |
| GET | `/files/<path>` | ไฟล์ใน `out/` (วิดีโอ ภาพนิ่ง thumbnail) |

งานทุกตัวเข้าคิวทีละงาน เมื่อเสร็จ worker จะ POST ผลไปที่ `callbackUrl` (ใน n8n คือ `$execution.resumeUrl` ของโหนด Wait) โดยเปลี่ยนโดเมนเป็น `N8N_INTERNAL_URL` เพื่อไม่ต้องผ่าน Cloudflare Access

**Workflows** (โฟลเดอร์ `n8n/`, Import ผ่านเมนู Workflows → Import from File)

- `A-draft-story.json` ฟอร์มกรอกนิทาน → Claude ร่างบท → อนุมัติใน Telegram
- `B-produce-episode.json` เสียง → ภาพนิ่งตรวจ → เรนเดอร์ → อัปโหลด YouTube แบบ Private + Made for Kids → บันทึก Google Sheet
- `C-health-check.json` เช็ก worker ทุก 30 นาที

หลัง Import: เปิดโหนด **Settings** ในแต่ละ workflow ใส่ `telegramChatId` (และ `sheetId` ใน B) แล้วเลือก credential ในโหนดที่ขึ้นเตือน
แก้ workflow ได้ใน `n8n/build-workflows.py` แล้วรัน `python3 n8n/build-workflows.py`

**ติดตั้ง n8n**: `cd n8n && cp .env.n8n.example .env` ใส่โดเมน แล้ว `docker compose up -d` (ถ้าจะรัน cloudflared ใน Docker ด้วย ใช้ `docker compose --profile tunnel up -d`)
