import CryptoJS from "crypto-js";
const fd = {
    "Admission Date:": "Tid: PD1: 9 September 2025",
    "Referral Source:": "Tid: PD2: Referred by Dr. Wilson",
    "Race and Ethnicity:": "Tid: PD3: Black African",
    "Preferred Language, Interpreter Requirement and Type of Interpreter (Family / Friend / Professional/Other):": "Tid: PD4: Preferred language: English; no interpreter required",
    "Height and Weight:": "Tid: PD6: Height: 6 feet; Weight: 155 pounds",
    "Primary Diagnosis for Home Health Admission:": "Tid: C1: Primary diagnosis: anxiety and pain in the left leg; history of hip injury two months prior",
    "Secondary Diagnoses:": "Tid: C2: No secondary diagnoses",
    "Vital Signs (Temp - Route, O2 Saturation - Method, Pulse Rate - Location, BP - Position and Side, Resp Rate):": "Tid: C3: Temperature: taken orally (value not documented); O2 saturation: normal (method not documented); Pulse: 72 bpm (location not documented); BP: 120/80 (lying down position, left side); Respiratory rate: 77",
    "Comorbidities or Special Treatments or Procedures (Cancer / Respiratory / Endocrine / Anemia Type / Other):": "Tid: C4: Diabetes mellitus (on medication for 4 years, not using insulin)",
    "Diabetes Management (Fasting and Random Blood Sugars, Insulin Use, Performed By):": "Tid: C5: Fasting blood sugar: 90 mg/dL; Random blood sugar: 110 mg/dL; On oral diabetes medication; not using insulin",
    "Shingles (Zoster) vaccine received / offered:": "Tid: R1: Shingles vaccine not received",
    "Predictors for infection (Immunocompromised, Instrumentation / Surgery / Wound/ Caregiver Role / Cognition / Poor Mobility / Medication / Others):": "Tid: R2: No predictors for infection identified",
    "Risk assessment tool of choice (SMH Project BOOST or HHQI Acute Care Hospitalization Risk Assessment) and Assessment Details:": "Tid: R3: HHQY acute care hospitalization risk (stated in notes)",
    "Overall Risk for infection (High Risk / No Risk):": "Tid: R4: Overall infection risk: Low",
    "Surgical Procedures in the past 14 days:": "Tid: R5: No surgical procedures in the past 14 days",
    "Recent Hospitalization or ED Visits in last 6 months:": "Tid: R6: No recent hospitalizations or ED visits in last 6 months except for the hip injury",
    "Patient Prognosis:": "Tid: R7: Prognosis: Good",
    "Patient’s Living Situation (Alone, With Family, Facility):": "Tid: SSL1: Lives with family",
    "Caregiver availability and  assistance (Around the clock / Daytime / Nighttime / Occasional / No Assistance):": "Tid: SSL2: Primary caregiver: daughter; assistance occasional (drives to appointments); does not require extensive assistance",
    "Transportation availability:": "Tid: SSL3: Daughter provides transportation to appointments",
    "Health Literacy:": "Tid: SSL4: Good health literacy; able to name/know all medications",
    "Home Environment and Safety Concerns:": "Tid: SSL5: Home environment safety concerns: narrow passages and long winding staircase",
    "Barriers to Health Status:": "Tid: SSL6: No clear barriers to health identified",
    "Additional Information or other notes:": "Tid: Page 3 Note:: Na",
    "Vision Impairments and/or Corrective Lenses / Aids used:": "Tid: S1: No visual impairments reported.",
    "Hearing Ability (side and level of impairment) and Use of Aid:": "Tid: S2: Hearing ability normal.",
    "Speech (Normal, Slurred, Nonverbal):": "Tid: S3: Speech normal.",
    "Pain Assessment (Location, Description, Severity, Frequency, Nonverbal cues):": "Tid: P1: Pain located on left lower 'soul' (as documented); occurs primarily with intense walking; does not significantly affect daily activity otherwise.",
    "Pain Effect on Daily Activity, Therapy and Sleep:": "Tid: P2: Does not affect daily activities much; impacts him when walking intensely (e.g., climbing stairs).",
    "Pain Intensity - Current, Past Week Least and Most Pain (Scale of 0 – No pain to 10 – Worst Pain Possible):": "Tid: P3: Current pain intensity about 4/10; previous pain intensity about 6/10.",
    "Pain Relief Measures and Management Effectiveness:": "Tid: P4: No pain relief measures currently being used.",
    "Potential Pain Aberrant Behavior: (N/A  / Appears intoxicated  / Hoarding of prescriptions  / Increase to dosage without physician approval  / Purposeful over-sedation / Reports lost/stolen prescriptions  / Requests frequent/early prescription renewal  / Use of pain meds for situational stress /  Other)": "Tid: P5: No potential pain aberrant behaviors noted.",
    "Presence of Pressure Ulcers (Stage, Location, Size):": "Tid: I1: No pressure ulcers present.",
    "Presence of Statis Ulcer (Observable, Non-Observable, Both):": "Tid: I2: No stasis ulcers present.",
    "Surgical Wounds or Other Open Areas:": "Tid: I3: One surgical wound on the right knee.",
    "Skin Conditions (Color, Rashes, Bruises, Tears, Trauma):": "Tid: I4: No other skin conditions reported.",
    "Norton Pressure Sore Risk Assessment: Physical Condition (Good / Fair / Poor / Very Bad)": "Tid: I5: Norton physical condition: Fair.",
    "Norton Pressure Sore Risk Assessment: Mental Condition (Alert / Apathetic / Confused / Stuporous)": "Tid: I6: Norton mental condition: Apathetic.",
    "Norton Pressure Sore Risk Assessment: Activity (Ambulant / Walks with Help / Chairbound / Bedfast)": "Tid: I7: Norton activity: Ambulant.",
    "Norton Pressure Sore Risk Assessment: Mobility (Full, Slightly Impaired, Very Limited, Immobile)": "Tid: I8: Patient is mobile; reports difficulty climbing stairs.",
    "Norton Pressure Sore Risk Assessment: Incontinence (None / Occasional / Usually Urinary /Urinary and Fecal)": "Tid: I9: Incontinence: None reported.",
    "Respiratory Assessment (Condition / Symptom / Device / Procedure):": "Tid: O1: Respiratory: Breathing fine, no devices or procedures noted.",
    "Noticeable Dyspnea or Short of Breath during Walking / Moderate or Minimal Exertion /At Rest:": "Tid: O2: No dyspnea at rest; shortness of breath not reported but difficulty with stairs/ climbing noted.",
    "Cardiac Assessment (Condition / Symptom / Device / Procedure):": "Tid: O3: Cardiac: No past or current cardiac issues reported.",
    "Genitourinary Assessment (Condition / Symptom / Device / Procedure):": "Tid: O4: Genitourinary: No urinary issues reported.",
    "UTI in the last 14 days:": "Tid: O5: No UTI in the last 14 days.",
    "Gastrointestinal Assessment (Condition / Symptom / Device / Procedure):": "Tid: O6: Gastrointestinal: No GI issues; no constipation or diarrhea.",
    "Bowel Management (Constipation, Diarrhea, Ostomy):": "",
    "Orientation to Person, Place, Time:": "Tid: CM1: Well oriented to person, place, and time; knows current date.",
    "Orientation to Current Date (Correct or missed by how much):": "Tid: CM2: Orientation to current date: Correct.",
    "Neurological Assessment (Forgetful, Headache, Tremors, Seizures, Confused, Anxious, etc.):": "Tid: CM3: Not forgetful; caregiver reports occasional/mild anxiety; no other neurologic symptoms noted.",
    "Ability to Repeat 3 words (Sock, Blue, Bed) and Recall for 2 attempts:": "Tid: CM4: Able to repeat the three words and recall them on testing.",
    "Signs of Delirium (Acute Onset of Mental Change, Inattention, Disorganized Thinking, Altered Level of Consciousness):": "Tid: CM5: No signs of delirium or altered level of consciousness.",
    "Daily Cognitive functioning (Level of Alertness and Comprehension, Level of Assistance Required):": "Tid: CM6: Good alertness and comprehension; no confusion; able to follow conversation.",
    "Confusion and Anxiety with the last 14 days (Frequency, Examples):": "Tid: CM7: Anxiety present sometimes per caregiver (occasional mild anxiety).",
    "Mood Assessment- PHQ2 (Interest in doing things, depressed, sleep issues, energy levels, appetite, feeling down, concentration, slow moving, fidgeting, thoughts of self-harm, loneliness):": "Tid: CM8: Has interest in doing things but reports reduced appetite; no other depressive symptoms documented.",
    "Behavioral Issues Presence and Frequency (Aggression / Withdrawal):": "Tid: CM9: No behavioral issues (aggression/withdrawal) noted.",
    "Psychiatric Symptoms and Frequency (Infantile / Inappropriate / Delusional / Paranoia):": "Tid: CM10: No psychiatric symptoms such as delusions or inappropriate behavior noted.",
    "Prior history of falls in the past 3 months:": "Tid: F1: No falls in the past 3 months.",
    "Musculoskeletal Assessment (Condition / Symptom / Device / Procedure):": "Tid: F2: Hip pain when getting out of bed; muscles appear okay; injury to left sole causing some gait difficulty; experiences some pain with transfers.",
    "Ambulation and Stair Use (Independent, Requires one handed/ two handed device, Prosthetics, Chairfast self or dependent, Bedfast):": "Tid: F3: Uses a walking stick for ambulation; ambulation testing used a walker (walks 10 ft with walker; 50 ft with two turns with walker + assistance); generally able to use stairs previously but requires assistance for steps per assessment.",
    "Transfer Ability from Bed to Chair (Level of Assistance, Weight bearing, Bed Positioning, Bedfast):": "Tid: F4: Patient reports independent bed-to-chair transfer but assessment indicates transfers (bed↔chair) require assistance; some pain with attempted transfers.",
    "Grooming and Dressing of Upper and Lower Body (Level of Assistance Required):": "Tid: F5: Independent for upper and lower body grooming and dressing.",
    "Bathing: (Level of Assistance, Device Use, Location  (Shower / Tub / Sink / Chair)):": "Tid: F6: Independent for bathing; able to bathe in the shower without assistance.",
    "Toileting: (Level of Assistance, Device Use, Location (Commode / Bed Pan), Level of Hygiene Management):": "Tid: F7: Requires assistance for toileting; daughter helps him sit on the commode.",
    "Feeding and Eating Ability (Level of Assistance, Level of Hygiene Management, Meal Assistance, Supervised Feeding, With or Without Nasogastric Tube):": "Tid: F8: Decreased appetite but able to eat all meals without supervision or assistance; daughter prepares his meals.",
    "Putting on or taking off footwear (Level of Assistance):": "Tid: F9: Does not wear footwear indoors due to injury to left sole.",
    "Durable Medical Equipment Required (Bedside Commode, Cane, Grab Bars, Oxygen, etc):": "Tid: F10: Uses a walking stick (cane); walker used for ambulation testing; uses a commode.",
    "Functional Mobility Level of Assistance at SOC: Roll Left or Right": "Tid: F11: Able to roll left and right independently.",
    "Functional Mobility Level of Assistance at SOC: Sitting to Lying": "Tid: F12: Able to move from sitting to lying independently.",
    "Functional Mobility Level of Assistance at SOC: Lying to Sitting on Bed": "Tid: F13: Able to move from lying to sitting at bedside independently.",
    "Functional Mobility Level of Assistance at SOC: Sit to Stand": "Tid: F14: Unable to sit to stand without assistance.",
    "Functional Mobility Level of Assistance at SOC: Chair/ Bed to Chair Transfer": "Tid: F15: Unable to transfer between chair and bed without assistance.",
    "Functional Mobility Level of Assistance at SOC: Toilet Transfer": "Tid: F16: Unable to transfer to the toilet without assistance.",
    "Functional Mobility Level of Assistance at SOC: Car Transfer": "Tid: F17: Unable to transfer to a car without assistance.",
    "Functional Mobility Level of Assistance at SOC: Walk 10 feet": "Tid: F18: Can walk 10 feet with a walker.",
    "Functional Mobility Level of Assistance at SOC: Walk 50 feet with 2 turns": "Tid: F19: Can walk 50 feet with two turns using a walker with assistance.",
    "Functional Mobility Level of Assistance at SOC: Walk 150 feet": "Tid: F20: Unable to walk 150 feet.",
    "Functional Mobility Level of Assistance at SOC: Walk 10 feet on uneven surface": "Tid: F21: Unable to walk 10 feet on uneven surface.",
    "Functional Mobility Level of Assistance at SOC: 1 Step (Curb)": "Tid: F22: Can negotiate 1 step/curb with assistance.",
    "Functional Mobility Level of Assistance at SOC: 4 Steps": "Tid: F23: Can ascend/descend 4 steps with assistance.",
    "Functional Mobility Level of Assistance at SOC: 12 Steps": "Tid: F24: Can ascend/descend 12 steps with assistance.",
    "Functional Mobility Level of Assistance at SOC: Picking Up Object": "Tid: F25: Unable to pick up an object.",
    "Prior self-care for Bathing, Dressing, Toileting and Eating (Level of Assistance):": "Tid: PF1: Previously independent for bathing, dressing, toileting, and eating.",
    "Prior Indoor Ambulation and Stair Use (Level of Assistance):": "Tid: PF2: Previously ambulatory and able to use stairs comfortably without assistance.",
    "Prior Functional Cognition (Level of Assistance with planning tasks such as shopping or medication):": "Tid: PF3: Prior functional cognition independent (able to plan shopping, manage medications, etc.).",
    "Prior Transfer Ability from Bed to Chair (Level of Assistance, Weight bearing, Bed):": "Tid: PF4: Previously able to transfer from bed to chair independently.",
    "Prior Device Use:": "Tid: PF5: Did not use any assistive devices in the past.",
    "Nutritional Concerns (Mention all that apply): (Parenteral / IV feeding, Dentures, Tube Feeding, Appetite, Chewing, Hydration, Weight Change, Therapeutic Diet, Mechanically Altered)": "Tid: N1: Decreased appetite; daughter prepares meals; no tube feeding or parenteral nutrition noted.",
    "Oral Hygiene:": "Tid: N2: Oral hygiene good.",
    "Nutritional Requirements (Heart Healthy, Low Salt of Fat, Fluid Restriction, etc.):": "Tid: N3: No therapeutic dietary restrictions reported.",
    "Nutritional Health Screen (Mention all that apply): Eats fewer than 2 meals a day / Has a tooth/mouth problem that makes it hard to eat / Has 3 or more drinks of beer, liquor or wine almost every day / Does not always have enough money to buy foods needed / Eats few fruits or vegetables, or milk products / Eats alone most of the time / Takes 3 or more prescribed or OTC medications a day": "Tid: N4: Eats all meals (despite decreased appetite); no tooth/mouth problems reported.",
    "Current Medications including High Risk (Name, Dose, Frequency, Route, Indication):": "Tid: M1: Albendazole; metformin (no doses/frequencies provided).",
    "Medication Status (Mention all that apply): Reconciled / Issues Identified / Anticoagulant Use / Prefilled Pill Box / Prefilled Insulin Syringe / IV or Infusion Therapy": "Tid: M2: Medications reconciled; medication issues reviewed.",
    "Drug review (issues, medications, side effects, allergies, changes, recommended action):": "Tid: M3: Medication review completed; no specific drug issues documented in the note.",
    "Caregiver education and training on high risk medication/ problem reporting:": "Tid: M4: Caregiver (daughter) educated and understands medication side effects.",
    "Medication Management for Oral (Level of Assistance required relating to Ability, Dose, Frequency)": "Tid: M5: No assistance required for oral medication management.",
    "Medication Management for IV (Level of Assistance required relating to Ability, Dose, Frequency)": "Tid: M6: No IV medications prescribed.",
    "Therapy and Services Required (Skilled Nursing / Physical Therapy / Occupational Therapy / Speech Therapy / Home Health Aides)": "Tid: M7: Physical therapy recommended.",
    "Emergency Plan Reviewed with Patient:": "Tid: M8: Emergency plan reviewed with the patient.",
    "Presence of Advance Directive or DNR Order:": "Tid: M9: No information documented regarding presence of advance directive or DNR."
}
const API_BASE = "https://api.sahara.care/openai";
const LOGIN_ENDPOINT = `https://api.sahara.care/user/login`;
const ENCRYPTION_ENDPOINT = `${API_BASE}/getencryptionkey`;
const GET_RESPONSE_ENDPOINT = `${API_BASE}/getresponse`;

const USER_CREDENTIALS = {
  email_id: "rachit@sahara.care",
  password: "U2FsdGVkX18pSDw/9XzZUA/kyM6xTQNCkGH6SHvHELA=", // use env var in production
};

// === STATE ===
let accessToken = null;
let encryptionKey = null;

// === AUTH HELPERS ===
async function login() {
  console.log("🔐 Logging in...");
  const res = await fetch(LOGIN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(USER_CREDENTIALS),
  });

  const data = await res.json();
  console.log("📡 Login response:", data);

  if (!data.token) throw new Error("Login failed — token missing");
  accessToken = data.token;
  console.log("✅ Logged in successfully");
}

// === ENCRYPTION HELPERS ===
async function generateEncryptionKey() {
  console.log("🔑 Generating encryption key...");
  const res = await fetch(ENCRYPTION_ENDPOINT, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // If token expired → re-login and retry
  if (res.status === 401) {
    console.warn("⚠️ Access token expired during encryption key generation. Logging in again...");
    await login();
    return generateEncryptionKey();
  }

  const data = await res.json();
  if (!data?.data?.[0]?.encryption_key) {
    throw new Error("Failed to get encryption key");
  }

  encryptionKey = data.data[0].encryption_key;
  console.log("✅ Encryption key received");
}

// === ENCRYPTION FUNCTION ===
function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();
}

// === SEND ENCRYPTED REQUEST ===
async function sendEncryptedRequest(payload) {
  const pageHtml = encryptData(payload);
  const patientFormData = encryptData(fd);

  const body = { pageHtml, patientFormData };

  const res = await fetch(GET_RESPONSE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  // If token expired → re-login and retry
  if (res.status === 401) {
    console.warn("⚠️ Access token expired during API request. Logging in again...");
    await login();
    await generateEncryptionKey(); // new key for new token
    return sendEncryptedRequest(payload);
  }

  const result = await res.json();
  console.log("🧾 API result:", result);
  return result;
}

// === MAIN FLOW ===
export default async function getResponse(data) {
  const allResponses = [];

  try {
    // 1️⃣ Clean input: remove empty items and parse raw JSON strings
    const cleanedData = data
      .filter(item => item && (typeof item === 'object' || typeof item === 'string')) // remove null/undefined
      .map(item => {
        if (typeof item === 'string') {
          // remove ```json fences if present
          const jsonStr = item.replace(/```json|```/g, '').trim();
          try {
            const parsed = JSON.parse(jsonStr);
            return parsed; // could be an array or object
          } catch {
            return item; // fallback to string if parsing fails
          }
        }
        return item; // already an object
      });

    await login();
    await generateEncryptionKey();

    console.log(`🚀 Sending ${cleanedData.length} payloads sequentially...`);

    // 2️⃣ Process each payload
    for (const payload of cleanedData) {
      await generateEncryptionKey();
      console.log(`\n📦 Sending payload...`);

      const result = await sendEncryptedRequest(payload);

      let parsedResponse;
      if (typeof result.response === 'string') {
        try {
          parsedResponse = JSON.parse(result.response);
        } catch {
          parsedResponse = result.response; // fallback to raw string
        }
      } else {
        parsedResponse = result.response; // already parsed
      }

      // 3️⃣ Flatten the response into allResponses
      if (Array.isArray(parsedResponse)) {
        parsedResponse.forEach(item => {
          if (item && Object.keys(item).length) allResponses.push(item);
        });
      } else if (parsedResponse && typeof parsedResponse === 'object' && Object.keys(parsedResponse).length) {
        allResponses.push(parsedResponse);
      }
    }

    console.log("✅ All payloads processed.");
  } catch (err) {
    console.error("❌ Error in flow:", err.message);
  }

  return allResponses;
}



async function fetchFormFillRequest() {
  const FORM_FILL_URL = "https://api.sahara.care/patient/submitformfillrequest?org_id=ORG-0001&visit_id=ORG-0001/PVISIT-00000005";
  await login();
  console.log("📥 Fetching patient form fill request...");

  const res = await fetch(FORM_FILL_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  // 🔁 Handle expired/invalid token
  if (res.status === 401) {
    console.warn("⚠️ Access token expired or invalid during form fetch. Re-authenticating...");
    
    return fetchFormFillRequest(); // retry with new token
  }

  if (!res.ok) {
    console.log(res);
    throw new Error(`Failed to fetch form fill request (status: ${res.status})`);
  }

  const data = await res.json();
  console.log("✅ Form fill request data received:", data);
  return data;
}

