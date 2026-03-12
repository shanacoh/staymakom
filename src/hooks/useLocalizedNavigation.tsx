import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

export const useLocalizedNavigation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const lang = searchParams.get('lang') || 'en';

  const getLocalizedPath = useCallback(
    (path: string) => {
      if (lang === "en") return path;

      // Preserve hash fragments (e.g., "/#choose-escape") while appending query params
      const [pathWithoutHash, hash] = path.split("#");
      const separator = pathWithoutHash.includes("?") ? "&" : "?";
      const withLang = `${pathWithoutHash}${separator}lang=${lang}`;
      return hash ? `${withLang}#${hash}` : withLang;
    },
    [lang],
  );

  const navigateLocalized = useCallback((path: string) => {
    navigate(getLocalizedPath(path));
  }, [navigate, getLocalizedPath]);

  return { lang, getLocalizedPath, navigateLocalized };
};
