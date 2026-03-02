import {
  FunctionDeclaration,
  LiveServerToolCall,
  Modality,
  Type,
} from "@google/genai";
import { useEffect, useState, memo } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import "./english-learning.scss";

const declaration: FunctionDeclaration = {
  name: "render_english_lesson",
  description: "Displays an English lesson content including grammar, vocabulary, or communication tips.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "Title of the lesson or topic.",
      },
      content: {
        type: Type.STRING,
        description: "Main content of the lesson, explanation, or examples. Markdown is supported.",
      },
      examples: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "List of example sentences or phrases.",
      },
      tips: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING,
        },
        description: "List of helpful tips or common mistakes.",
      },
    },
    required: ["title", "content"],
  },
};

function EnglishLearningComponent() {
  const [lessonData, setLessonData] = useState<any>(null);
  const { client, setConfig, setModel } = useLiveAPIContext();

  useEffect(() => {
    setModel("models/gemini-2.5-flash-native-audio-preview-12-2025");
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are an expert English tutor, specializing in teaching English to Vietnamese speakers for work and daily communication. 
            Your teaching style is friendly, encouraging, and practical. 
            You speak like a native English speaker but understand the challenges Vietnamese learners face.
            
            When the user asks for a lesson, explanation, or help with English, provide a clear and concise response.
            Use the "render_english_lesson" function to display structured lesson content when appropriate (e.g., when explaining grammar rules, listing vocabulary, or providing communication tips).
            
            Always tailor your examples to be relevant to a work environment or daily life in Vietnam if possible.
            Encourage the user to practice pronunciation and usage.`,
          },
        ],
      },
      tools: [{ googleSearch: {} }, { functionDeclarations: [declaration] }],
    });
  }, [setConfig, setModel]);

  useEffect(() => {
    const onToolCall = (toolCall: LiveServerToolCall) => {
      console.log(`got toolcall`, toolCall);
      if (!toolCall.functionCalls) {
        return;
      }
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name
      );
      if (fc) {
        const args = fc.args as any;
        setLessonData(args);
      }
      // send data for the response of your tool call
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls?.map((fc) => ({
                response: { output: { success: true } },
                id: fc.id,
                name: fc.name,
              })),
            }),
          200
        );
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  if (!lessonData) {
    return <div className="english-learning-placeholder">Ready to learn English! Ask me anything.</div>;
  }

  return (
    <div className="english-lesson-card">
      <h3>{lessonData.title}</h3>
      <div className="lesson-content" dangerouslySetInnerHTML={{ __html: lessonData.content }} />
      
      {lessonData.examples && lessonData.examples.length > 0 && (
        <div className="lesson-section">
          <h4>Examples:</h4>
          <ul>
            {lessonData.examples.map((ex: string, i: number) => (
              <li key={i}>{ex}</li>
            ))}
          </ul>
        </div>
      )}

      {lessonData.tips && lessonData.tips.length > 0 && (
        <div className="lesson-section">
          <h4>Tips:</h4>
          <ul>
            {lessonData.tips.map((tip: string, i: number) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export const EnglishLearning = memo(EnglishLearningComponent);
