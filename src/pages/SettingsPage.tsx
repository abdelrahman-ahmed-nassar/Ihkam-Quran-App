import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BackgroundColorSetting } from "@/lib/settings";

type SettingsPageProps = {
  backgroundColorSetting: BackgroundColorSetting;
  onBackgroundColorChange: (setting: BackgroundColorSetting) => void;
  onBackToIndex: () => void;
};

const SettingsPage = ({
  backgroundColorSetting,
  onBackgroundColorChange,
  onBackToIndex,
}: SettingsPageProps) => {
  return (
    <section className="page-shell mx-auto w-full max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold">الإعدادات</h2>
        <Button variant="outline" onClick={onBackToIndex}>
          العودة
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لون الخلفية</CardTitle>
          <CardDescription>
            اختر لون خلفية التطبيق الذي تفضله. سيتم حفظ الاختيار تلقائيا.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            type="button"
            variant={backgroundColorSetting === "default" ? "outline" : "ghost"}
            className="w-full justify-start"
            aria-pressed={backgroundColorSetting === "default"}
            onClick={() => onBackgroundColorChange("default")}
          >
            الافتراضي
          </Button>
          <Button
            type="button"
            variant={backgroundColorSetting === "soft" ? "outline" : "ghost"}
            className="w-full justify-start"
            aria-pressed={backgroundColorSetting === "soft"}
            onClick={() => onBackgroundColorChange("soft")}
          >
            لون هادئ
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};

export default SettingsPage;
