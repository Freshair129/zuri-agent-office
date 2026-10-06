---
status: active
superseded_by: null
version: 0.5.1
---

# Zuri

แอปเดสก์ท็อปสำหรับจัดทีม AI agents บนเครื่องของคุณ ใช้ Electron, React, TypeScript, Hive และ terminal จริงจาก Munder Difflin โดยอ้างอิงสีและรูปแบบการใช้งาน Zuri Heritage

รุ่นพัฒนา Windows 0.5.1 — มีคลัง Marketing 50 skills และ 6 role presets ที่เลือกชุดเฉพาะ agent และจำได้หลัง restart พร้อมตัวเลือก Disable thinking สำหรับ local model ที่รองรับ ดู [Marketing verification](docs/ZURI-MARKETING-SKILLS-VERIFICATION.md) และ [Thinking verification](docs/ZURI-LOCAL-THINKING-VERIFICATION.md) ส่วน UI เดิมมี เมนูซ้ายย่อได้ ฉากสำนักงาน 2.5D ตรงกลาง และ Agent Drawer ที่ปิด–เปิดได้ พร้อม Zuri tokens กระจกและ motion แบบพอดี ดูผลตรวจจริงใน [Shell verification](docs/ZURI-OFFICE-SHELL-VERIFICATION.md), [Stabilization checkpoint](docs/ZURI-STABILIZATION-VERIFICATION.md) และ [Reference verification](docs/ZURI-REFERENCE-VERIFICATION.md) ผล build ไม่เท่ากับผ่าน workflow ทั้งหมด

## เริ่มใช้งาน

ในเครื่องที่สร้างแพ็กเกจแล้ว เปิด `dist/marketing-0.5.1/win-unpacked/Zuri.exe` เลือกโฟลเดอร์สำหรับ Hive แล้วเลือก engine/model ของ Zuri Coordinator จากนั้นเพิ่ม agent และเลือก working directory ของงาน สำหรับ checkout ใหม่ให้ build จาก source ตาม English quick start; repository นี้ยังไม่มี binary release รุ่น 0.5.1

- Terminal แสดง input/output ของ CLI จริง; Command Center มี tasks, memory, activity และ worker views
- Auto mode ใช้สิทธิ์แบบอัตโนมัติตาม engine เดิม อ่านคำอธิบายใน onboarding และปิดได้ตามงาน
- Hive, tasks และ Markdown memory เก็บในโฟลเดอร์ที่เลือก; application config/log/cache อยู่ใน `%APPDATA%/ZuriAgentOffice`
- ไม่อ่านข้อมูล Munder Difflin โดยปริยาย; protocol ใช้ `zuri-agent-office://` แต่ hire schema เดิมยังรับได้
- Update เป็น manual-only ไม่มี feed อัตโนมัติ; product analytics ปิด

## Marketing roles

Add agent → **Briefing** → **Marketing role** เลือก Marketing Lead, Content & Brand, SEO Specialist, Performance Marketing, Lifecycle & CRM หรือ Sales & RevOps ปรับชุด skills ได้สูงสุด 8 รายการรวม `product-marketing` แล้วเลือก provider/model/workspace ตามเดิมก่อนกด Spawn

เปิดแท็บ **Skills → Zuri Marketing** ใน Agent Drawer เพื่อตรวจรายการที่เลือกและผล provisioning คลังกลางมี 50 skills จาก Corey Haines v2.11.17 ตรึง commit `dda3841f0b294e01e93b1541486beefbfab0915e` พร้อม MIT license และ file hashes ไม่อัปเดตอัตโนมัติ

แต่ละโปรเจกต์ใช้ `.agents/product-marketing.md` ร่วมกัน แม้ agent ทำงานใน worktree แยก เมื่อไม่มีไฟล์นี้ ให้มอบหมาย Marketing Lead สร้างฉบับร่างจากข้อมูลสินค้าจริง สถานะ **Provisioned at last start** ยืนยันการเตรียมไฟล์ ไม่ยืนยันว่าโมเดลอ่านหรือใช้งานสำเร็จ และไม่แปลว่าเชื่อมบัญชีโฆษณาหรือ CRM แล้ว

ไฟล์ skills ที่ถูกแก้ในพื้นที่ agent จะถูกเก็บไว้และแสดง **Provisioning failed** แทนการทับไฟล์ การเปลี่ยนชุดมีผลเมื่อเริ่ม agent ครั้งถัดไป ชุดนี้ติดตั้งใน Zuri เท่านั้น ไม่เปลี่ยน global skills ของ Codex/Claude

ตรวจต้นฉบับใน checkout ได้ด้วย `node tools/marketing-provenance.cjs` ดูขอบเขตและการทดสอบใน [approved contract](docs/ZURI-MARKETING-SKILLS.md)

ผล live ล่าสุด [snapshot 5.0.6](docs/ZURI-MARKETING-MODEL-CANDIDATE-VERIFICATION.md): qwen3.5:9b ผ่าน Task A เฉพาะการตรวจอัตโนมัติ แต่ Task B ไม่อ่าน context ซ้ำและไม่มี completion marker จึงไม่ผ่านเกณฑ์และไม่เริ่ม Zuri arm ไม่มีการเปลี่ยน default model หรือรับรองความพร้อมใช้งานจริง ไฟล์ screenshots, profiles, ZIP และแพ็กเกจในรายงานเป็นหลักฐาน local ที่ไม่ได้รวมใน Git checkout

## Local LLM

ติดตั้ง OpenCode แล้วเปิด Ollama, LM Studio หรือ vLLM ด้วยตัวคุณเอง ใน onboarding เลือก OpenCode/local หรือ Settings → AI Engines ตั้ง endpoint, exact Model ID และ key หาก server ต้องใช้ แล้วกด Test connection and tools

ตัวอย่าง base URL ต้องตรงกับ server จริง เช่น `http://127.0.0.1:11434/v1` สำหรับ Ollama ที่เปิดพอร์ตนั้น หรือ `http://127.0.0.1:1234/v1` สำหรับ LM Studio ที่ตั้งไว้ ไม่มีการสมมติว่า server เปิดอยู่หรือไม่มี authentication

HTTP อนุญาตเฉพาะ loopback; endpoint อื่นต้องใช้ HTTPS ตาม validation ของ broker เดิม และห้ามฝัง key ใน URL

Model ID ต้องตรงกับ `/models`; Zuri ตรึง `local/<model>` และ local provider รวมถึง background model โดยไม่ fallback ไป cloud หากเลือก endpoint ไว้ การผ่าน probe ยืนยันเพียงการเชื่อมต่อ/โมเดล/basic tool call ต้องทดสอบงานของ agent ต่อ

ตั้ง context ของ model server ให้เพียงพอกับ prompt และ tools โดยเริ่มที่อย่างน้อย 16,384 tokens สำหรับเส้นทางที่ทดสอบ งาน OpenCode + `qwen3.5:4b` อ่านไฟล์จริงผ่านที่ 16k แต่ค่าเริ่มต้น 4k ตัด input จาก 7,589 เหลือ 2,050 tokens จน agent ไม่เรียก tool แม้ probe ผ่าน งาน Hive ที่มีคำสั่งยาวอาจต้องใช้มากกว่า 16k และต้องมี RAM/VRAM เพียงพอ สำหรับ Ollama ตั้ง `$env:OLLAMA_CONTEXT_LENGTH = '16384'` ใน PowerShell ก่อนเริ่ม server instance ด้วย `ollama serve`; Zuri ไม่เปลี่ยนค่าหรือ restart server ให้อัตโนมัติ ดูหลักฐานใน [Local provider verification](docs/LOCAL-PROVIDER-VERIFICATION.md)

Key เก็บผ่าน encrypted secret broker เดิม ไม่ใส่ใน source/config/log หาก CLI ยังไม่ติดตั้งหรือ model/tool calling ไม่รองรับ ให้แก้ตามสถานะที่แสดง Cloud CLI ยังใช้บัญชีของคุณได้เมื่อเลือกใช้อย่างชัดเจน

## Build จาก source

ใช้ package-lock.json เดิม แนะนำ Node 20 ตาม CI upstream และ Windows C++ build tools พร้อม Spectre libraries สำหรับ node-pty

```powershell
npm ci
npm run typecheck
npm run test:focused
npm run build
npm run dev
npm run dist:win
```

เครื่องทดสอบนี้ใช้ Node 24 และขาด native build prerequisites บางรายการ จึงมีขั้นตอน recovery สำหรับ local artifact ใน verification report อย่าเรียก JS build ว่า native runtime ผ่านจนกว่าจะตรวจ ABI จริง

`ZURI_USER_DATA_DIR` ต้องเป็น absolute path ใช้แยกข้อมูลทดสอบได้ ไม่จำเป็นสำหรับการใช้งานปกติ

## Memory และการเชื่อมต่อ

Markdown memory/Hive ใช้ได้โดยไม่ต้องติดตั้ง semantic CLI ส่วน MemPalace เป็น optional dependency ที่ต้องตรวจสถานะจริง จุดเชื่อม MSP/GKS และ local knowledge อยู่ใน [integration seams](docs/ZURI-INTEGRATION-SEAMS.md); MVP ยังไม่เชื่อม MSP/GKS/object storage

Provider ที่เลือกได้รับ prompt, workspace context และ tool results ตามพฤติกรรม CLI ของมัน บริการ voice/Slack/integrations ใช้เฉพาะเมื่อตั้งค่าและเปิดใช้งาน ส่วน product telemetry/upstream marketing/update calls ถูกปิด

## English quick start

Install the selected CLI and model server, run `npm ci`, `npm run build`, then `npm run dev`. Complete onboarding, choose a Hive home and configure OpenCode/local with the exact endpoint and model. Test the connection, add an agent, assign a small task and inspect its terminal. Read the verification report for tested combinations and remaining limitations. Windows artifacts are local unsigned development builds; publishing is disabled.

## Provenance และสิทธิ์

Based on Munder Difflin by Chaitanya Giri, MIT. Original copyright remains in [LICENSE](LICENSE). Exact upstream commit, public/binary source gaps and asset decisions: [UPSTREAM.md](UPSTREAM.md). Dependency/font notices: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt). Restricted LimeZu scene assets were replaced with original Zuri art. Version 0.2.0 uses newly generated furniture and three adult character bases with five garment variants each; original source images and provenance are retained.

## Version diff

Upstream package 0.4.6 → Zuri 0.1.0: Zuri branding/roles/office/icon, separate data and protocol identity, manual updates, disabled analytics/marketing requests, explicit local provider configuration and validation. Electron/dependency versions retained. No deployment or remote publication.

Zuri 0.1.0 → 0.1.1: restrained glass shells, Motion 14.0.0 tab/dialog feedback, larger touched labels, focus-safe exits and dynamic Reduced Motion. Snapshot 1.1.0 records before/after images and video; backend/provider behavior is unchanged.

Zuri 0.1.1 → 0.2.0: generated miniature office, smooth character frames and portraits, isometric projection, shared furniture/navigation placement, calibrated seating and depth ordering. Snapshot 2.0.0 records versioned packaged-app evidence. Existing glass, motion, avatar IDs and backend/provider contracts remain.

Zuri 0.2.0 → 0.3.0: the user rejected 0.2.0 reference resemblance. The corrected renderer uses the exact reference-derived empty room, perspective floor mapping, four workstation pods, a rear glass meeting room and new front/back actor poses. Snapshot 3.0.0 separates visual review from mechanical checks. Previous artifacts remain available as historical evidence.

Zuri 0.3.0 → 0.3.1: managed-worktree teardown preserves parent dependencies and retry metadata. Supported-platform baseline failures are repaired; unsupported file-symlink cases remain explicit skips. Snapshot 3.0.1 records the actual packaged lifecycle.

Zuri 0.3.1 → 0.4.0: collapsible functional navigation, closable responsive Agent Drawer, compact roster and quieter thought labels. The office, terminal and current draft persist through drawer visibility changes. Snapshot 4.0.0 records packaged shell checks and separate visual review; prior artifacts remain unchanged.

Zuri 0.4.0 → 0.5.0: pinned central marketing library, six role presets, per-agent selection and non-destructive provisioning with shared project context. Zuri 0.5.0 → 0.5.1: explicit endpoint/model-scoped local thinking option. Evidence 5.0.1–5.0.6 records bounded live experiments and remaining acceptance failures; it is not a production-readiness claim.
