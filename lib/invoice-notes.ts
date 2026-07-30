import type { Language } from "@/lib/types"

// Default invoice notes / terms & conditions, pre-loaded for every
// environment that seeds an invoice draft (demo state, onboarding defaults,
// and the existing-user DB fallback in lib/db/queries.ts). Never mutated in
// place — callers that need a per-user override read that override first
// and fall back to this constant only when nothing is stored yet.
export const DEFAULT_INVOICE_NOTES: Record<Language, string> = {
  km: `- ករណីបន្ទប់ដែលបង់ប្រាក់យឺតយ៉ាវលើសពី1អាទិត្យ ត្រូវពិន័យ1ថ្ងៃ $5
- ម្ចាស់ផ្ទះ មិនទទួលខុសត្រូវសងម៉ូតូនិងឡានដែលអត់បង់សេវាកាពារប្រចាំខែឡើយ
- រាល់ការកក់ប្រាក់រួចហើយ មិនមកស្នាក់នៅតាមការកំណត់នោះនឹងទុកជាអសារបង់
- ហាមប្រើប្រាស់គ្រឿងញៀននិងអាវុធគ្រប់ប្រភេទខុសច្បាប់ព្រះរាជាណាចក្រកម្ពុជា
- ហាមស្រែកឡូឡា និងផឹកស្រា
- ករណីខ្វះការប្រុងប្រយ័ត្នមានអគ្គីភ័យចេញពីបន្ទប់ជួល ដោយចេតនានិងអចេតនានោះ ត្រូវទទួលខុសត្រូវសងនិងទោសចំពោះមុខច្បាប់

សូមរក្សាសេចក្តីថ្លៃថ្នូរក្នុងការរស់នៅ និងមនុស្សជុំវិញ អរគុណ`,
  en: `- In case room payment is delayed by more than 1 week, a late fee fine of $5 per day will apply.
- The landlord is not responsible for compensation for motorbikes or cars that do not pay the monthly security fee.
- Any deposit made will be forfeited if you fail to move in according to the agreement.
- Illegal drugs and weapons of any kind violating the laws of the Kingdom of Cambodia are strictly prohibited.
- Shouting/making loud noises and drinking alcohol are prohibited.
- In case of negligence causing a fire originating from the rented room, whether intentional or unintentional, you will be held financially responsible and subject to legal penalties.

- Please maintain dignity in living and respect towards people around you. Thank you.`,
}
