import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { FONT_WEIGHT_CLASSES } from '@/lib/fonts';

export function FontShowcase() {
  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Tajawal Font Family</CardTitle>
        <CardDescription>
          Complete font family with Arabic and Latin support
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font Weights */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Font Weights</h3>
          <div className="grid gap-3">
            <div className={`text-2xl ${FONT_WEIGHT_CLASSES.extralight}`}>
              Extra Light (200) - WesalTech Business Platform
            </div>
            <div className={`text-2xl ${FONT_WEIGHT_CLASSES.light}`}>
              Light (300) - WesalTech Business Platform
            </div>
            <div className={`text-2xl ${FONT_WEIGHT_CLASSES.regular}`}>
              Regular (400) - WesalTech Business Platform
            </div>
            <div className={`text-2xl ${FONT_WEIGHT_CLASSES.medium}`}>
              Medium (500) - WesalTech Business Platform
            </div>
            <div className={`text-2xl ${FONT_WEIGHT_CLASSES.bold}`}>
              Bold (700) - WesalTech Business Platform
            </div>
            <div className={`text-2xl ${FONT_WEIGHT_CLASSES.extrabold}`}>
              Extra Bold (800) - WesalTech Business Platform
            </div>
            <div className={`text-2xl ${FONT_WEIGHT_CLASSES.black}`}>
              Black (900) - WesalTech Business Platform
            </div>
          </div>
        </div>

        {/* Arabic Support */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Arabic Support</h3>
          <div className="space-y-2">
            <div className="text-2xl font-normal" dir="rtl" lang="ar">
              منصة إدارة الأعمال - وصال تك
            </div>
            <div className="text-lg font-medium" dir="rtl" lang="ar">
              نظام إدارة شامل للشركات والمؤسسات
            </div>
          </div>
        </div>

        {/* Mixed Content */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Mixed Content (Arabic + English)</h3>
          <div className="space-y-2">
            <div className="text-xl font-medium">
              WesalTech - منصة إدارة الأعمال
            </div>
            <div className="text-base">
              Complete business management solution - حل شامل لإدارة الأعمال
            </div>
          </div>
        </div>

        {/* Typography Scale */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Typography Scale</h3>
          <div className="space-y-2">
            <div className="text-4xl font-bold">Heading 1 - عنوان رئيسي</div>
            <div className="text-3xl font-semibold">Heading 2 - عنوان فرعي</div>
            <div className="text-2xl font-medium">Heading 3 - عنوان ثالث</div>
            <div className="text-xl font-medium">Heading 4 - عنوان رابع</div>
            <div className="text-lg">Body Large - نص كبير</div>
            <div className="text-base">Body Regular - نص عادي</div>
            <div className="text-sm">Body Small - نص صغير</div>
            <div className="text-xs">Caption - تسمية توضيحية</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}