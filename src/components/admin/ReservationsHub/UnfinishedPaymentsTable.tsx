/**
 * Liste de relance derrière la puce « Paiements non aboutis » : paiements en ligne échoués
 * ou jamais terminés. Ce ne sont pas des réservations. Une ligne par client et par
 * expérience, avec le nombre de tentatives.
 */

import { format, parseISO } from "date-fns";
import { ChevronDown, MessageCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/components/admin/BookingsGrid/columnTypes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FOLLOW_UP_LANGUAGES, buildPaymentFollowUpMessage, buildWhatsAppLink } from "@/lib/reservations/whatsapp";
import type { UnfinishedPayment } from "@/lib/reservations/types";

const UnfinishedPaymentsTable = ({ payments }: { payments: UnfinishedPayment[] }) => (
  <section className="space-y-2">
    <div>
      <h2 className="text-sm font-semibold text-foreground">Paiements en ligne non aboutis</h2>
      <p className="text-xs text-muted-foreground">
        Pas des réservations. Une ligne par client et par expérience, tentatives regroupées. Sert de liste de relance.
      </p>
    </div>
    {payments.length === 0 ? (
      <div className="rounded-lg border bg-card py-12 text-center text-sm text-muted-foreground">
        Aucun paiement non abouti.
      </div>
    ) : (
      <div className="overflow-x-auto rounded-lg border bg-card">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Expérience</TableHead>
              <TableHead>Tentatives</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.key} className={cn(payment.converted && "text-muted-foreground")}>
                <TableCell className="font-medium">{payment.client}</TableCell>
                <TableCell className="max-w-[280px] truncate">{payment.product}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <span className="tabular-nums">{payment.attempts}</span>
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    · {payment.kind === "failed" ? "échoué" : "non terminé"} le {format(parseISO(payment.lastAttemptAt), "dd/MM")}
                  </span>
                </TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">
                  {formatCurrency(payment.amount, payment.currency)}
                </TableCell>
                <TableCell>
                  {payment.converted ? (
                    <Badge variant="outline" className="whitespace-nowrap border-transparent bg-muted font-medium text-foreground">
                      Converti en manuel
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="whitespace-nowrap border-amber-200 bg-amber-50 font-medium text-amber-900">
                      Jamais payé
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {payment.converted ? (
                    <span className="text-xs">Rien à faire</span>
                  ) : payment.customerPhone ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-3.5 w-3.5" />
                          Relancer sur WhatsApp
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {FOLLOW_UP_LANGUAGES.map((language) => (
                          <DropdownMenuItem key={language.value} asChild>
                            <a
                              href={buildWhatsAppLink(
                                payment.customerPhone as string,
                                buildPaymentFollowUpMessage(payment.client, payment.productByLanguage[language.value], language.value),
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {language.label}
                            </a>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-xs text-muted-foreground">Pas de téléphone</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </section>
);

export default UnfinishedPaymentsTable;
