# ร้านอาหารสัตว์ 🌾

### รับสินค้าเข้าและวันหมดอายุ

เปิด `/receiving` เพื่อเลือกผู้จำหน่าย สินค้า จำนวน ราคาทุน วันที่รับเข้า และวันหมดอายุ บันทึกแล้วระบบจะเพิ่มสต็อกพร้อมใบรับสินค้าใน transaction เดียวกัน ประวัติสามารถค้นหาและกรองรายการที่หมดอายุหรือใกล้หมดอายุภายใน 30 วันได้

ฐานข้อมูลเดิม: รัน `node database/migrate-receiving.cjs` จากโฟลเดอร์โปรเจกต์หนึ่งครั้ง เพื่อเพิ่มคอลัมน์วันหมดอายุโดยรักษาข้อมูลเดิม (อ่านการเชื่อมต่อจาก `.env.local`) รายการเก่าจะแสดงวันหมดอายุว่าไม่ระบุ ไม่ต้อง import SQL ใหม่

วันหมดอายุเป็นข้อมูลประจำรอบรับสินค้า ยังไม่ได้แยกยอดคงเหลือหรือตัดสต็อกขายตามล็อต

ระบบหน้าร้านขายอาหารสัตว์ ทำส่งวิชา Database

มีหน้าขายสินค้า (POS) กับหน้าจัดการสินค้า ทุกครั้งที่กดปุ่มที่แก้ข้อมูล จะมีกล่อง **SQL Log** มุมจอบอกว่าส่งคำสั่ง SQL อะไรเข้า MySQL จริงๆ พร้อมค่าที่ใส่ไปและผลลัพธ์

## ทำอะไรได้บ้าง

- **ขายสินค้า** เลือกสินค้าลงตะกร้า รับเงินสด คิดเงินทอน พิมพ์ใบเสร็จ
  - ตัดสต็อกใน transaction และใช้ `SELECT ... FOR UPDATE` ล็อคแถว กันสองเครื่องขายของชิ้นเดียวกันจนสต็อกติดลบ
- **จัดการสินค้า** เพิ่ม / แก้ / ลบ / ปรับสต็อก ค้นหา และกรองตามหมวดหมู่
  - ลบสินค้าที่อยู่ในบิลแล้วไม่ได้ เพราะติด foreign key
- **SQL Log** โชว์คำสั่งที่รันจริงทีละบรรทัด รวมถึง `START TRANSACTION` / `COMMIT` / `ROLLBACK` และ error ของ MySQL
  - ลากย้ายได้ (จับที่แถบหัว) ดับเบิลคลิกแถบหัวเพื่อกลับมุมขวาล่าง

## ใช้อะไรทำ

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- MySQL ต่อผ่าน `mysql2` เขียน SQL เอง ไม่ใช้ ORM

## ติดตั้ง

### ต้องมีก่อน

| โปรแกรม | หมายเหตุ |
|---|---|
| [Git](https://git-scm.com/) | |
| [Node.js](https://nodejs.org/) | เอารุ่น LTS (ขั้นต่ำ 18.18) |
| [MySQL Community Server](https://dev.mysql.com/downloads/mysql/) | 8.4 LTS ขึ้นไป ตอนลงจะให้ตั้งรหัส root จดไว้ด้วย |
| MySQL Workbench | ไม่บังคับ ไว้เปิดดูตาราง |

### Windows

ใช้ **Command Prompt** (cmd) นะ ไม่ใช่ PowerShell เพราะ PowerShell ใช้ `<` ในขั้นที่ 3 ไม่ได้

```cmd
:: 1. โหลดโปรเจ็คกับ package
git clone <ลิงก์ repo>
cd animal-feed-shop
npm install

:: 2. ทำไฟล์ตั้งค่า แล้วแก้ DB_PASSWORD เป็นรหัส root ของ MySQL
copy .env.example .env.local
notepad .env.local

:: 3. สร้างฐานข้อมูล (มีตารางและข้อมูลตัวอย่างมาให้)
mysql -u root -p < database\animal_feed_shop.sql

:: 4. รัน
npm run dev
```

แล้วเปิด http://localhost:3000

### macOS / Linux

เหมือนกัน ต่างแค่คำสั่ง copy กับเครื่องหมาย path

```bash
git clone <ลิงก์ repo>
cd animal-feed-shop
npm install
cp .env.example .env.local        # แล้วแก้ DB_PASSWORD
mysql -u root -p < database/animal_feed_shop.sql
npm run dev
```

## ไฟล์ `.env.local`

| ตัวแปร | ค่าปกติ | |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | |
| `DB_PORT` | `3306` | |
| `DB_USER` | `root` | |
| `DB_PASSWORD` | | รหัสที่ตั้งตอนลง MySQL |
| `DB_NAME` | `animal_feed_shop` | |

ไฟล์นี้ไม่ขึ้น git อยู่แล้ว (มีรหัสผ่าน) แต่ละเครื่องต้องทำเอง

## ฐานข้อมูล

ไฟล์ `database/animal_feed_shop.sql` export มาจาก `mysqldump` มีครบทั้งตาราง foreign key และข้อมูลตัวอย่าง

> ⚠️ ไฟล์นี้มี `DROP TABLE IF EXISTS` ถ้า import ซ้ำ ข้อมูลที่มีอยู่ในฐาน `animal_feed_shop` จะถูกทับหมด

| ตาราง | เก็บอะไร |
|---|---|
| `categories` | หมวดหมู่สินค้า (อาหารไก่ อาหารหมู ...) |
| `products` | สินค้า ราคาขาย และสต็อก |
| `sales` | หัวบิลขาย (วันที่ ยอดรวม วิธีจ่าย) |
| `sale_details` | รายการสินค้าในแต่ละบิล |
| `suppliers` | ผู้จำหน่าย |
| `purchases`, `purchase_details` | ใบสั่งซื้อ (มีตารางแล้ว ยังไม่มีหน้าเว็บ) |

ถ้าแก้ข้อมูลแล้วอยากอัปเดตไฟล์นี้:

```bash
mysqldump -u root -p --databases animal_feed_shop --set-gtid-purged=OFF --no-tablespaces --skip-dump-date > database/animal_feed_shop.sql
```

## โครงสร้างโค้ด

```
src/
├── app/
│   ├── pos/          หน้าขายสินค้า
│   ├── products/     หน้าจัดการสินค้า
│   └── api/          API (products, categories, sales)
├── server/           SQL ทั้งหมดอยู่ที่นี่ แยกตามตาราง
├── lib/
│   ├── db.ts         connection pool, runSql(), inTransaction()
│   └── ...           type, validation, ตัวเรียก API ฝั่งหน้าเว็บ
├── components/       ของที่ใช้ร่วมกัน (Modal, SqlLogPanel, ...)
└── hooks/
```

SQL Log ทำงานยังไง: ทุก query วิ่งผ่าน `runSql()` ใน `src/lib/db.ts` ซึ่งจดคำสั่งไว้ทุกครั้ง แล้ว API ที่เกิดจากการกดปุ่มจะส่งรายการนั้นกลับมาให้หน้าเว็บแสดง ข้อความที่โชว์ได้จาก `mysql2.format()` ตัวเดียวกับที่ใช้แทนค่า `?` ก่อนส่งเข้า MySQL จริง เลยตรงกับที่ฐานข้อมูลได้รับ

## เจอปัญหา

**`'mysql' is not recognized ...`**
ยังไม่ได้เพิ่ม MySQL ใน PATH ให้เพิ่ม `C:\Program Files\MySQL\MySQL Server 8.4\bin` (เปลี่ยนเลขรุ่นตามที่ลง) แล้วเปิด cmd ใหม่ หรือจะ import ผ่าน Workbench ก็ได้ ที่เมนู Server → Data Import → Import from Self-Contained File

**เว็บเปิดได้แต่ขึ้น "โหลดข้อมูลไม่สำเร็จ"**
ต่อฐานข้อมูลไม่ได้ เช็คตามนี้:
- MySQL รันอยู่ไหม (Windows: เปิด Services หา `MySQL84` ดูว่า Running)
- รหัสใน `.env.local` ถูกไหม
- import ไฟล์ `.sql` แล้วหรือยัง

แก้ `.env.local` แล้วต้องหยุด `npm run dev` (Ctrl+C) แล้วรันใหม่

**`Access denied for user 'root'@'localhost'`**
รหัสผ่านใน `.env.local` ผิด

**port 3000 ถูกใช้อยู่**
รันพอร์ตอื่นแทน `npm run dev -- -p 3001`
