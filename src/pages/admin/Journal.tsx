// Back-office du Journal : articles (anciens et blog automatique), file de sujets, réglages.
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArticlesTab } from "@/components/admin/journal/ArticlesTab";
import { TopicsTab } from "@/components/admin/journal/TopicsTab";
import { SettingsTab } from "@/components/admin/journal/SettingsTab";

const TABS = ["articles", "sujets", "reglages"] as const;

const AdminJournal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (TABS as readonly string[]).includes(searchParams.get("tab") || "") ? searchParams.get("tab")! : "articles";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Journal</h1>
        <p className="text-sm text-muted-foreground">
          Un article est rédigé chaque matin à 05:00 (heure d'Israël) à partir de la file de sujets, puis publié à 17:00 s'il passe les contrôles.
        </p>
      </div>
      <Tabs value={tab} onValueChange={(value) => setSearchParams({ tab: value }, { replace: true })}>
        <TabsList>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="sujets">File de sujets</TabsTrigger>
          <TabsTrigger value="reglages">Réglages</TabsTrigger>
        </TabsList>
        <TabsContent value="articles" className="mt-4">
          <ArticlesTab />
        </TabsContent>
        <TabsContent value="sujets" className="mt-4">
          <TopicsTab />
        </TabsContent>
        <TabsContent value="reglages" className="mt-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminJournal;
