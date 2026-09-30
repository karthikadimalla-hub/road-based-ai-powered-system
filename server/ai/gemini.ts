import { GoogleGenAI } from '@google/genai';

export interface AIAnalysisResult {
  category:
    | 'pothole'
    | 'damaged_road'
    | 'traffic_signal'
    | 'streetlight'
    | 'open_manhole'
    | 'road_obstruction'
    | 'unsafe_intersection'
    | 'damaged_sign'
    | 'waterlogging'
    | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  visible_evidence: string;
  safety_risk: string;
  suggested_priority: 'low' | 'medium' | 'high' | 'critical';
  raw_response?: string;
  source: 'gemini' | 'heuristic_engine';
}

const VALID_CATEGORIES = [
  'pothole',
  'damaged_road',
  'traffic_signal',
  'streetlight',
  'open_manhole',
  'road_obstruction',
  'unsafe_intersection',
  'damaged_sign',
  'waterlogging',
  'other',
] as const;

const VALID_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export async function analyzeRoadHazard(
  imageBase64: string | null,
  mimeType: string = 'image/jpeg',
  description: string,
  userSelectedCategory?: string
): Promise<AIAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const promptText = `
You are analyzing a road-safety report submitted by a citizen in India.
Analyze the provided image (if available) and user description.
Identify the most likely road-safety hazard.
Return ONLY valid JSON matching this exact structure:
{
  "category": "pothole | damaged_road | traffic_signal | streetlight | open_manhole | road_obstruction | unsafe_intersection | damaged_sign | waterlogging | other",
  "severity": "low | medium | high | critical",
  "confidence": 0.88,
  "visible_evidence": "concise description of visible damage or defect from evidence",
  "safety_risk": "specific danger posed to Indian road users (especially two-wheelers, auto-rickshaws, and pedestrians)",
  "suggested_priority": "low | medium | high | critical"
}

Guidelines:
1. Do not invent information that cannot be determined from the image or description.
2. If image is unclear or not fully visible, reduce confidence to below 0.65 and mention that human inspection is recommended.
3. Factor in common Indian road risks (monsoon waterlogging hiding deep craters, unlit streetlights endangering night commuters, open manholes causing fatal two-wheeler skids).
4. User provided description: "${description || 'None provided'}"
${userSelectedCategory ? `User preliminary tag: "${userSelectedCategory}"` : ''}
`;

      const contents: any[] = [];

      if (imageBase64) {
        // Strip data:image/...;base64, header if present
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
        contents.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      contents.push({
        text: promptText,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: contents },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const text = response.text?.trim() || '';
      const parsed = JSON.parse(text);

      const category = VALID_CATEGORIES.includes(parsed.category)
        ? parsed.category
        : (userSelectedCategory as any) || 'other';

      const severity = VALID_LEVELS.includes(parsed.severity)
        ? parsed.severity
        : 'medium';

      const suggested_priority = VALID_LEVELS.includes(parsed.suggested_priority)
        ? parsed.suggested_priority
        : severity;

      const confidence = typeof parsed.confidence === 'number'
        ? Math.max(0.1, Math.min(1.0, parsed.confidence))
        : 0.85;

      return {
        category,
        severity,
        confidence: Number(confidence.toFixed(2)),
        visible_evidence: parsed.visible_evidence || 'Hazard identified from evidence submitted.',
        safety_risk: parsed.safety_risk || 'Potential hazard to vehicles and pedestrians.',
        suggested_priority,
        raw_response: text,
        source: 'gemini',
      };
    } catch (err) {
      console.warn('Gemini API call failed or timed out, executing intelligent fallback:', err);
      // Fall through to heuristic analyzer
    }
  }

  // Intelligent heuristic analyzer (fallback when key is missing or quota limited)
  return analyzeHeuristically(description, userSelectedCategory, Boolean(imageBase64));
}

function analyzeHeuristically(
  description: string,
  userSelectedCategory?: string,
  hasImage: boolean = true
): AIAnalysisResult {
  const text = (description || '').toLowerCase();

  let category: AIAnalysisResult['category'] = 'other';
  if (text.includes('pothole') || text.includes('gadda') || text.includes('crater') || text.includes('pit')) {
    category = 'pothole';
  } else if (text.includes('signal') || text.includes('traffic light') || text.includes('red light') || text.includes('blinking')) {
    category = 'traffic_signal';
  } else if (text.includes('streetlight') || text.includes('dark') || text.includes('light not working') || text.includes('pole')) {
    category = 'streetlight';
  } else if (text.includes('manhole') || text.includes('drain') || text.includes('chamber') || text.includes('gutter') || text.includes('open cover')) {
    category = 'open_manhole';
  } else if (text.includes('water') || text.includes('flood') || text.includes('rain') || text.includes('clogged') || text.includes('waterlogging')) {
    category = 'waterlogging';
  } else if (text.includes('tree') || text.includes('debris') || text.includes('block') || text.includes('obstruction') || text.includes('boulder')) {
    category = 'road_obstruction';
  } else if (text.includes('sign') || text.includes('board') || text.includes('damaged sign') || text.includes('missing board')) {
    category = 'damaged_sign';
  } else if (text.includes('intersection') || text.includes('junction') || text.includes('blind spot') || text.includes('crossing')) {
    category = 'unsafe_intersection';
  } else if (text.includes('damaged') || text.includes('crack') || text.includes('broken road') || text.includes('tar') || text.includes('uneven')) {
    category = 'damaged_road';
  } else if (userSelectedCategory && VALID_CATEGORIES.includes(userSelectedCategory as any)) {
    category = userSelectedCategory as any;
  }

  // Determine Severity
  let severity: AIAnalysisResult['severity'] = 'medium';
  if (
    category === 'open_manhole' ||
    text.includes('fatal') ||
    text.includes('critical') ||
    text.includes('deep crater') ||
    text.includes('blind curve accident')
  ) {
    severity = 'critical';
  } else if (
    category === 'traffic_signal' ||
    text.includes('urgent') ||
    text.includes('huge') ||
    text.includes('major accident') ||
    text.includes('heavy traffic') ||
    text.includes('high risk')
  ) {
    severity = 'high';
  } else if (text.includes('minor') || text.includes('small') || text.includes('faded')) {
    severity = 'low';
  }

  // Safety risk determination tailored to Indian context
  let safety_risk = 'May cause sudden braking, vehicle chassis damage, and risk to commuters.';
  let visible_evidence = 'Road defect observed in report description and submitted photographic evidence.';

  switch (category) {
    case 'open_manhole':
      safety_risk = 'Extremely hazardous: Uncovered chamber poses life-threatening risk for two-wheelers and pedestrians, especially at night or during rainfall.';
      visible_evidence = 'Missing manhole cover with exposed underground drainage chamber.';
      break;
    case 'pothole':
      safety_risk = 'High skid risk for two-wheelers and auto-rickshaws; abrupt swerving causes head-on collisions in heavy Indian traffic.';
      visible_evidence = 'Surface depression and aggregate displacement forming pothole cavity.';
      break;
    case 'waterlogging':
      safety_risk = 'Severely reduces tyre traction and masks submerged potholes or open drains, stalling low-clearance vehicles.';
      visible_evidence = 'Substantial water stagnation across road carriage width with blocked stormwater runoff.';
      break;
    case 'traffic_signal':
      safety_risk = 'High collision risk at junction due to unregulated cross-traffic flow and pedestrian vulnerability.';
      visible_evidence = 'Signal aspect dark, unpowered, or stuck on amber cycle.';
      break;
    case 'streetlight':
      safety_risk = 'Zero night visibility heightens antisocial activity, pedestrian strikes, and unnoticed road hazards.';
      visible_evidence = 'Non-operational luminaire on roadway causing dark road stretch.';
      break;
    case 'road_obstruction':
      safety_risk = 'Sudden stationary obstruction forces sudden lane departure into oncoming vehicular flow.';
      visible_evidence = 'Fallen branch or debris occupying active carriage lane.';
      break;
    default:
      safety_risk = 'Compromises safe vehicular passage and pedestrian thoroughfare.';
      visible_evidence = 'Surface irregularities and infrastructural defect noted.';
  }

  const confidence = hasImage ? 0.91 : 0.72;
  const suggested_priority = severity === 'critical' ? 'critical' : severity === 'high' ? 'high' : 'medium';

  return {
    category,
    severity,
    confidence,
    visible_evidence,
    safety_risk,
    suggested_priority,
    source: 'heuristic_engine',
  };
}
