import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RevolutDebugSubTest {
  id: string;
  name: string;
  pass: boolean | null;
  detail: string;
}

export interface RevolutDebugStepResult {
  stepIndex: number;
  name: string;
  pass: boolean | null;
  duration: number;
  detail: string;
  diagnosis?: string;
  warning?: string;
  tests?: RevolutDebugSubTest[];
  skipped?: boolean;
  data?: unknown;
}

export interface RevolutDebugVerdict {
  type: 'success' | 'error' | 'warning' | 'idle';
  source: string;
  message: string;
  action: string;
}

const STEP_NAMES = [
  'Connexion basique',
  'Configuration des secrets',
  'Authentification & Création d\'ordre',
  'Récupération de l\'ordre',
  'Jeton public pour le widget',
];

interface CarryData {
  orderId?: string;
  publicId?: string;
  state?: string;
  configData?: {
    secretKey?: { configured: boolean; name: string; preview: string | null };
    webhookSecret?: { configured: boolean };
    baseUrl?: string;
    apiVersion?: string;
  };
}

export function useRevolutDebug(environment: 'dev' | 'prod' = 'prod') {
  const [results, setResults] = useState<RevolutDebugStepResult[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);

  const updateStep = (idx: number, result: Partial<RevolutDebugStepResult>) => {
    setResults(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...result };
      return copy;
    });
  };

  const runAll = useCallback(async () => {
    const skipFrom = (from: number, detail: string) => {
      for (let i = from; i < STEP_NAMES.length; i++) {
        updateStep(i, { pass: null, skipped: true, detail });
      }
    };

    setRunning(true);
    const globalStart = Date.now();

    const initial: RevolutDebugStepResult[] = STEP_NAMES.map((name, i) => ({
      stepIndex: i, name, pass: null, duration: 0, detail: 'En attente...', skipped: false,
    }));
    setResults(initial);

    const carry: CarryData = {};

    // STEP 1 — Connexion basique (ping)
    const s1Start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('revolut-payment', {
        body: { action: 'ping', environment },
      });
      const dur = Date.now() - s1Start;
      if (error) throw new Error(error.message || 'invoke error');
      const overrideApplied = data?.envOverrideApplied === true;
      updateStep(0, {
        pass: true, duration: dur,
        detail: `Edge Function accessible (${dur}ms${overrideApplied ? ', override admin actif' : ''})`,
      });
    } catch (e: unknown) {
      const dur = Date.now() - s1Start;
      const msg = e instanceof Error ? e.message : String(e);
      updateStep(0, {
        pass: false, duration: dur,
        detail: `Edge Function inaccessible: ${msg}`,
        diagnosis: "PROBLÈME CHEZ NOUS — La fonction serveur \"revolut-payment\" ne répond pas. Vérifier : 1) Elle est bien déployée sur Supabase 2) Supabase n'est pas en panne 3) Le nom de la fonction est correct",
      });
      skipFrom(1, 'Skipped (étape précédente échouée)');
      setRunning(false);
      setLastRun(new Date().toLocaleString('fr-FR'));
      setTotalDuration(Date.now() - globalStart);
      return;
    }

    // STEP 2 — Configuration des secrets (check-config)
    const s2Start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('revolut-payment', {
        body: { action: 'check-config', environment },
      });
      const dur = Date.now() - s2Start;
      if (error) throw new Error(error.message || 'invoke error');

      const config = data?.data;
      const tests: RevolutDebugSubTest[] = [];
      const secretKeyOk = config?.secretKey?.configured === true && config?.secretKey?.length > 10;
      tests.push({
        id: '2.1',
        name: `Secret ${config?.secretKey?.name || '?'} configuré`,
        pass: secretKeyOk,
        detail: secretKeyOk
          ? `OK (preview: ${config?.secretKey?.preview || '?'})`
          : `MANQUANT — ajouter ce secret dans Supabase`,
      });
      const webhookOk = config?.webhookSecret?.configured === true && config?.webhookSecret?.length > 10;
      tests.push({
        id: '2.2',
        name: 'Secret REVOLUT_WEBHOOK_SIGNING_SECRET configuré',
        pass: webhookOk,
        detail: webhookOk ? `OK (${config.webhookSecret.length} caractères)` : 'MANQUANT — les notifications de paiement ne pourront pas être vérifiées',
      });
      const expectedHost = environment === 'prod' ? 'merchant.revolut.com' : 'sandbox-merchant.revolut.com';
      const urlOk = typeof config?.baseUrl === 'string' && config.baseUrl.includes(expectedHost);
      tests.push({
        id: '2.3',
        name: `URL serveur cohérente avec env ${environment.toUpperCase()}`,
        pass: urlOk,
        detail: config?.baseUrl || 'inconnue',
      });

      carry.configData = config;

      const allPass = tests.every(t => t.pass);
      let diagnosis = '';
      if (!secretKeyOk) {
        diagnosis = `PROBLÈME CHEZ NOUS — La clé secrète Revolut "${config?.secretKey?.name}" n'est pas dans les secrets Supabase (ou elle est vide). Va dans Settings → Edge Functions → Secrets et ajoute-la.`;
      } else if (!webhookOk) {
        diagnosis = "PROBLÈME CHEZ NOUS — Le secret de webhook n'est pas configuré. Sans lui, ton serveur ne pourra pas vérifier l'authenticité des notifications de paiement Revolut. Crée d'abord le webhook côté Revolut, puis copie le 'signing secret' dans le secret Supabase REVOLUT_WEBHOOK_SIGNING_SECRET.";
      } else if (!urlOk) {
        diagnosis = "Incohérence d'environnement entre ce qui est demandé et ce que le serveur utilise.";
      }

      updateStep(1, {
        pass: allPass, duration: dur,
        detail: allPass ? `${tests.length}/${tests.length} secrets et URL OK` : 'Configuration incomplète',
        tests, diagnosis: diagnosis || undefined,
        warning: !secretKeyOk ? 'Sans cette clé, aucun paiement ne peut être créé.' : undefined,
      });

      if (!secretKeyOk) {
        skipFrom(2, 'Skipped (clé secrète manquante)');
        setRunning(false);
        setLastRun(new Date().toLocaleString('fr-FR'));
        setTotalDuration(Date.now() - globalStart);
        return;
      }
    } catch (e: unknown) {
      const dur = Date.now() - s2Start;
      const msg = e instanceof Error ? e.message : String(e);
      updateStep(1, { pass: false, duration: dur, detail: `Erreur: ${msg}` });
      skipFrom(2, 'Skipped');
      setRunning(false);
      setLastRun(new Date().toLocaleString('fr-FR'));
      setTotalDuration(Date.now() - globalStart);
      return;
    }

    // STEP 3 — Authentification & création d'ordre (vraie requête Revolut)
    const s3Start = Date.now();
    try {
      const ref = `SM-DEBUG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now()}`;
      const { data, error } = await supabase.functions.invoke('revolut-payment', {
        body: {
          action: 'create-order',
          environment,
          amount: 1.00,
          currency: 'EUR',
          description: 'StayMakom Debug Test (admin)',
          bookingRef: ref,
        },
      });
      const dur = Date.now() - s3Start;

      if (error || !data?.success) {
        const errStr = error?.message || data?.error || 'unknown';
        const isAuthError = /401|403|unauthor|forbidden|invalid.*token|api.?key/i.test(errStr);
        if (isAuthError) {
          updateStep(2, {
            pass: false, duration: dur,
            detail: `Clé secrète Revolut rejetée (${errStr.substring(0, 100)})`,
            diagnosis: `PROBLÈME CHEZ NOUS — La clé secrète ${environment === 'prod' ? 'REVOLUT_SECRET_KEY_PROD' : 'REVOLUT_SECRET_KEY'} est invalide, expirée, ou ne correspond pas à l'environnement (${environment === 'prod' ? 'production' : 'sandbox'}). Vérifier dans le dashboard Revolut Business → Developer → API.`,
          });
        } else {
          updateStep(2, {
            pass: false, duration: dur,
            detail: `Création d'ordre échouée : ${errStr.substring(0, 150)}`,
            diagnosis: 'Vérifier les logs Supabase pour le détail de l\'erreur Revolut.',
          });
        }
        skipFrom(3, 'Skipped (création d\'ordre échouée)');
        setRunning(false);
        setLastRun(new Date().toLocaleString('fr-FR'));
        setTotalDuration(Date.now() - globalStart);
        return;
      }

      const order = data.data;
      carry.orderId = order?.orderId;
      carry.publicId = order?.publicId;
      carry.state = order?.state;

      const tests: RevolutDebugSubTest[] = [];
      tests.push({ id: '3.1', name: 'Réponse 2xx de Revolut', pass: true, detail: `${dur}ms` });
      tests.push({ id: '3.2', name: 'orderId retourné', pass: !!order?.orderId, detail: order?.orderId ? `${String(order.orderId).substring(0, 20)}...` : 'manquant' });
      tests.push({ id: '3.3', name: 'publicId retourné', pass: !!order?.publicId, detail: order?.publicId ? `${String(order.publicId).substring(0, 20)}...` : 'manquant' });
      tests.push({ id: '3.4', name: 'state initial PENDING', pass: order?.state === 'PENDING', detail: order?.state || 'inconnu' });

      const allPass = tests.every(t => t.pass);
      updateStep(2, {
        pass: allPass, duration: dur,
        detail: allPass ? `Ordre créé en ${dur}ms (${tests.length} checks OK)` : 'Réponse incomplète de Revolut',
        tests,
        warning: environment === 'prod' ? 'Cet ordre a été créé en PRODUCTION (1€ EUR). Il restera en PENDING — aucun argent n\'a été débité car aucune carte n\'a été saisie.' : undefined,
      });
    } catch (e: unknown) {
      const dur = Date.now() - s3Start;
      const msg = e instanceof Error ? e.message : String(e);
      updateStep(2, { pass: false, duration: dur, detail: `Erreur: ${msg}` });
      skipFrom(3, 'Skipped');
      setRunning(false);
      setLastRun(new Date().toLocaleString('fr-FR'));
      setTotalDuration(Date.now() - globalStart);
      return;
    }

    // STEP 4 — Récupération de l'ordre (vérifie get-order)
    const s4Start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke('revolut-payment', {
        body: { action: 'get-order', environment, orderId: carry.orderId },
      });
      const dur = Date.now() - s4Start;
      if (error || !data?.success) {
        const errStr = error?.message || data?.error || 'unknown';
        updateStep(3, {
          pass: false, duration: dur,
          detail: `get-order échoué : ${errStr.substring(0, 120)}`,
          diagnosis: 'PROBLÈME CHEZ NOUS — L\'endpoint get-order ne fonctionne pas. Vérifier le code de l\'Edge Function revolut-payment.',
        });
        skipFrom(4, 'Skipped (get-order échoué)');
      } else {
        const order = data.data;
        const tests: RevolutDebugSubTest[] = [];
        tests.push({ id: '4.1', name: 'orderId retourné identique', pass: order?.orderId === carry.orderId, detail: order?.orderId === carry.orderId ? 'identique' : 'différent !' });
        tests.push({ id: '4.2', name: 'state lisible', pass: typeof order?.state === 'string', detail: String(order?.state || 'inconnu') });
        tests.push({ id: '4.3', name: 'champ payments présent (array ou null)', pass: order?.payments === null || order?.payments === undefined || Array.isArray(order?.payments), detail: Array.isArray(order?.payments) ? `${order.payments.length} paiements` : 'aucun' });

        const allPass = tests.every(t => t.pass);
        updateStep(3, {
          pass: allPass, duration: dur,
          detail: allPass ? `${tests.length}/${tests.length} OK` : 'Format de réponse inattendu',
          tests,
        });
      }
    } catch (e: unknown) {
      const dur = Date.now() - s4Start;
      const msg = e instanceof Error ? e.message : String(e);
      updateStep(3, { pass: false, duration: dur, detail: `Erreur: ${msg}` });
    }

    // STEP 5 — Format jeton public pour le widget
    const s5Start = Date.now();
    {
      const tests: RevolutDebugSubTest[] = [];
      const publicId = carry.publicId;
      tests.push({ id: '5.1', name: 'publicId est une chaîne non vide', pass: typeof publicId === 'string' && publicId.length > 0, detail: publicId ? `${publicId.length} caractères` : 'manquant' });
      tests.push({ id: '5.2', name: 'publicId fait au moins 10 caractères', pass: typeof publicId === 'string' && publicId.length >= 10, detail: typeof publicId === 'string' ? `${publicId.length} caractères` : 'n/a' });
      const widgetMode = environment === 'prod' ? 'prod' : 'sandbox';
      tests.push({ id: '5.3', name: `Mode widget cohérent (${widgetMode})`, pass: true, detail: `RevolutCheckout.payments({ mode: "${widgetMode}" })` });

      const allPass = tests.every(t => t.pass);
      const dur = Date.now() - s5Start;
      updateStep(4, {
        pass: allPass, duration: dur,
        detail: allPass ? `Jeton utilisable par le widget (mode ${widgetMode})` : 'Jeton public absent ou invalide',
        tests,
        diagnosis: !allPass ? 'PROBLÈME CHEZ NOUS — Le widget Revolut ne pourra pas être affiché sans publicId. Vérifier le champ "public_id" dans la réponse Revolut create-order.' : undefined,
      });
    }

    setLastRun(new Date().toLocaleString('fr-FR'));
    setTotalDuration(Date.now() - globalStart);
    setRunning(false);
  }, [environment]);

  const verdict: RevolutDebugVerdict = (() => {
    if (results.length === 0) return { type: 'idle', source: '', message: 'Aucun test exécuté.', action: 'Cliquez sur "Lancer tous les tests" pour commencer.' };

    if (results[0]?.pass === false) return {
      type: 'error', source: 'CHEZ NOUS',
      message: 'L\'Edge Function revolut-payment ne répond pas.',
      action: 'Vérifier que la function est bien déployée sur Supabase.',
    };
    if (results[1]?.pass === false) return {
      type: 'error', source: 'CHEZ NOUS',
      message: 'Les secrets Revolut ne sont pas tous configurés.',
      action: 'Aller dans Supabase → Settings → Edge Functions → Secrets et ajouter ce qui manque.',
    };
    if (results[2]?.pass === false) return {
      type: 'error', source: 'CHEZ NOUS',
      message: 'Revolut a refusé la création d\'ordre (clé invalide ou requête malformée).',
      action: 'Vérifier que la clé secrète correspond bien à l\'environnement choisi (sandbox vs production).',
    };
    if (results[3]?.pass === false) return {
      type: 'error', source: 'CHEZ NOUS',
      message: 'L\'endpoint get-order ne fonctionne pas correctement.',
      action: 'Vérifier les logs Supabase de la fonction revolut-payment.',
    };
    if (results[4]?.pass === false) return {
      type: 'error', source: 'CHEZ NOUS',
      message: 'Le jeton public pour le widget est manquant ou invalide.',
      action: 'Le checkout ne pourra pas s\'afficher pour les clients. Vérifier le mapping public_id → publicId dans l\'Edge Function.',
    };

    return {
      type: 'success', source: 'AUCUN',
      message: 'Tous les tests passent. L\'intégration Revolut fonctionne correctement.',
      action: 'Si un client signale un problème, vérifie aussi les logs côté Revolut Business → Developer → Webhooks.',
    };
  })();

  return { results, running, runAll, verdict, lastRun, totalDuration };
}
