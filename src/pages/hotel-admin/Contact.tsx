import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare } from "lucide-react";

export default function HotelContact() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-sans text-4xl font-bold mb-2">Contact & Support</h1>
        <p className="text-muted-foreground">Besoin d'aide ? Contactez l'équipe Staymakom</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Envoyer un message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Sujet</Label>
                <Input id="subject" placeholder="Ex: Question sur les commissions" />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea 
                  id="message" 
                  placeholder="Décrivez votre demande..."
                  rows={6}
                />
              </div>
              <Button className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Envoyer le message
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>FAQ rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium text-sm mb-1">How do I edit my prices?</p>
                <p className="text-sm text-muted-foreground">
                  Go to "Calendar" to adjust prices by period.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Quand suis-je payé ?</p>
                <p className="text-sm text-muted-foreground">
                  Les paiements sont transférés 48h après le début de l'expérience.
                </p>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Staymakom Commission</p>
                <p className="text-sm text-muted-foreground">
                  18% on each confirmed booking.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact direct</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href="mailto:partners@staymakom.com" className="text-primary hover:underline">
                  partners@staymakom.com
                </a>
              </div>
              <p className="text-sm text-muted-foreground">
                Notre équipe répond sous 24h ouvrées.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
