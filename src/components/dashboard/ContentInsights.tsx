
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, BookOpen, Search, ArrowUp, BarChart } from "lucide-react";

interface ContentInsightProps {
  period: string;
}

const ContentInsights: React.FC<ContentInsightProps> = ({ period }) => {
  return (
    <Card className="border-2 border-dashed border-primary/20 bg-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart size={20} className="text-primary" /> Key Insights for Presentation
          </CardTitle>
          <CardDescription>Copy these insights for your PPT slides</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-md shadow-sm">
          <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
            <BookOpen size={16} className="text-primary" /> Content Dashboard Summary
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>The system has successfully ingested <strong>16 content documents</strong>, with <strong>14 actively being referenced</strong> in user queries.</li>
            <li>A total of <strong>246 user questions</strong> have been answered using these content sources.</li>
            <li><strong>MPKV Krishi Darshani</strong> is our most utilized content source with <strong>42 question referrals</strong>.</li>
            <li><strong>2 contents</strong> remain completely unused, suggesting an opportunity for content optimization.</li>
            <li>On average, each content document is referenced in <strong>15.4 questions</strong>.</li>
            <li><strong>MPKV</strong> is the dominant content source, with <strong>13 documents</strong> contributing to <strong>135 question referrals</strong>.</li>
            <li>Peak content ingestion happened on <strong>May 1st</strong> with <strong>4 new documents</strong> added to the system.</li>
            <li>The highest question answering activity was on <strong>April 28th</strong> with <strong>41 questions</strong> answered.</li>
          </ul>
        </div>
        
        <div className="p-4 bg-white dark:bg-gray-800 rounded-md shadow-sm">
          <h3 className="text-md font-semibold mb-2 flex items-center gap-2">
            <ArrowUp size={16} className="text-primary" /> Recommendations
          </h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Consider reviewing and potentially upgrading or removing the 6 least-used content sources.</li>
            <li>Analyze why MPKV Krishi Darshani performs better than other content sources and apply those lessons to new content.</li>
            <li>Investigate patterns in question types to optimize future content creation.</li>
            <li>Explore opportunities to add non-English language content to diversify the content repository.</li>
          </ul>
        </div>
        
        <div className="bg-primary/10 p-4 rounded-md border border-primary/30">
          <p className="text-xs italic text-muted-foreground">
            * These insights are based on data from {period} and should be reviewed periodically as more content is added and additional questions are answered.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContentInsights;
