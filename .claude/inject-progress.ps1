# Force la sortie stdout en UTF-8 (Windows PowerShell 5.1 emet en cp1252 par defaut,
# ce qui corrompt accents/emojis et peut casser le JSON lu par le harness).
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false

# Hook SessionStart : injecte l'etat du projet au demarrage.
# - SUIVI_TRAVAUX.md : journal de bord courant (chantier en cours, prochaine action) -> PRIORITAIRE.
# - REWRITE_PROGRESS.md : archive de la reecriture (historique).
$suivi   = 'C:\Users\tahet\projects\cv-tailor\SUIVI_TRAVAUX.md'
$rewrite = 'C:\Users\tahet\projects\cv-tailor\REWRITE_PROGRESS.md'
$parts = @()
if (Test-Path $suivi) {
    $parts += "=== SUIVI_TRAVAUX.md (journal de bord courant - reprendre ici) ===`n`n" + (Get-Content $suivi -Raw -Encoding UTF8)
}
if (Test-Path $rewrite) {
    $parts += "`n`n=== REWRITE_PROGRESS.md (archive de la reecriture Next.js) ===`n`n" + (Get-Content $rewrite -Raw -Encoding UTF8)
}
if ($parts.Count -gt 0) {
    @{
        hookSpecificOutput = @{
            hookEventName     = 'SessionStart'
            additionalContext = ("Etat du projet cv-tailor, lu automatiquement au demarrage de session :`n`n" + ($parts -join "`n"))
        }
    } | ConvertTo-Json -Depth 5 -Compress
}
