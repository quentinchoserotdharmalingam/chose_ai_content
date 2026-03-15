"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SyntheseContent } from "@/types";

interface Props {
  content: object;
}

export function SyntheseRenderer({ content }: Props) {
  const data = content as SyntheseContent;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">{data.title}</h3>
        <p className="text-sm text-gray-500">{data.duration} de lecture</p>
      </div>

      {data.sections?.map((section, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm leading-relaxed text-gray-700">{section.content}</p>
            {section.keyPoints && section.keyPoints.length > 0 && (
              <div className="space-y-1">
                {section.keyPoints.map((point, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                    <span className="text-gray-600">{point}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {data.takeaways && data.takeaways.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base text-blue-800">Points clés à retenir</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.takeaways.map((takeaway, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                  <span className="font-bold">→</span>
                  {takeaway}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
