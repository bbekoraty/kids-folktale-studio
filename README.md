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

## TTS

- **Google Cloud TTS** (ค่าเริ่มต้น): เปิด Text-to-Speech API แล้วสร้าง API key ใส่ `GOOGLE_TTS_API_KEY`
  ชื่อเสียงใน `config/voices.json` เป็นค่าเริ่มต้น ควรลองฟังแล้วเลือกเสียงที่ชอบจาก [รายชื่อเสียง](https://cloud.google.com/text-to-speech/docs/voices)
- **ElevenLabs**: ใส่ `ELEVENLABS_API_KEY` และ voice id ใน `config/voices.json`
  ตรวจว่าโมเดลที่เลือก (`ELEVENLABS_MODEL_ID`) รองรับภาษาไทยก่อนใช้

## หมายเหตุ

- ช่องเด็กต้องตั้งค่า **Made for Kids** ตอนอัปโหลด
- เพลงประกอบต้องมีไลเซนส์ (เช่น YouTube Audio Library) วางไว้ใน `public/music/`
