import { DiagnosticBloc } from './useDiagnostic';

export const useDiagnosticExport = () => {
  const exportToMarkdown = (blocs: DiagnosticBloc[]) => {
    const allTests = blocs.flatMap(b => b.tests);
    const passed = allTests.filter(t => t.pass === true).length;
    const failed = allTests.filter(t => t.pass === false).length;
    const warnings = allTests.filter(t => t.warning).length;
    const na = allTests.filter(t => t.pass === null && !t.warning).length;

    let md = `# STAYMAKOM — DIAGNOSTIC REPORT\n\n`;
    md += `**Date:** ${new Date().toLocaleString('fr-FR')}\n\n`;
    md += `## Résultat Global\n\n`;
    md += `- ✅ **${passed} PASS**\n`;
    md += `- ❌ **${failed} FAIL**\n`;
    md += `- ⚠️ **${warnings} WARN**\n`;
    md += `- ⏸️ **${na} N/A**\n\n`;

    blocs.forEach(bloc => {
      if (bloc.tests.length === 0) return;
      
      md += `## BLOC ${bloc.id} — ${bloc.name}\n\n`;
      
      bloc.tests.forEach(test => {
        const icon = test.pass === null ? '⏸️' : test.warning ? '⚠️' : test.pass ? '✅' : '❌';
        md += `### ${icon} ${test.id}. ${test.name}\n`;
        md += `**Détail:** ${test.detail}\n`;
        if (test.duration) md += `**Durée:** ${test.duration}ms\n`;
        md += `\n`;
      });
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
  };

  return { exportToMarkdown };
};