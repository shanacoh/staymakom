import { useEffect, useState } from 'react';

export type AdminEnvironment = 'dev' | 'prod';

const HG_KEY = 'hg_admin_environment';
const REVOLUT_KEY = 'revolut_admin_environment';

const CHANGE_EVENT_PREFIX = 'admin-env-change-';

function readStored(storageKey: string): AdminEnvironment {
  if (typeof window === 'undefined') return 'prod';
  const raw = window.localStorage.getItem(storageKey);
  return raw === 'dev' ? 'dev' : 'prod';
}

function useAdminEnvironmentImpl(storageKey: string): [AdminEnvironment, (next: AdminEnvironment) => void] {
  const [env, setEnvState] = useState<AdminEnvironment>(() => readStored(storageKey));
  const eventName = `${CHANGE_EVENT_PREFIX}${storageKey}`;

  useEffect(() => {
    const sync = () => setEnvState(readStored(storageKey));
    window.addEventListener(eventName, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(eventName, sync);
      window.removeEventListener('storage', sync);
    };
  }, [storageKey, eventName]);

  const setEnv = (next: AdminEnvironment) => {
    window.localStorage.setItem(storageKey, next);
    setEnvState(next);
    window.dispatchEvent(new Event(eventName));
  };

  return [env, setEnv];
}

export function useHyperGuestAdminEnvironment() {
  return useAdminEnvironmentImpl(HG_KEY);
}

export function useRevolutAdminEnvironment() {
  return useAdminEnvironmentImpl(REVOLUT_KEY);
}
