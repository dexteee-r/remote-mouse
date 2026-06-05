' ============================================================================
'  Remote Mouse Controller — Lanceur
'  Detecte automatiquement pythonw.exe (aucun chemin code en dur).
'  Double-clic pour demarrer, sans fenetre de terminal.
' ============================================================================

Set objFSO   = CreateObject("Scripting.FileSystemObject")
Set WshShell = CreateObject("WScript.Shell")

strDir     = objFSO.GetParentFolderName(WScript.ScriptFullName)
strLauncher = strDir & "\launcher.pyw"

' --- 1. Cherche pythonw.exe dans le PATH (commande "where") -----------------
pythonExe = FindOnPath("pythonw.exe")

' --- 2. Repli : python.exe dans le PATH -------------------------------------
If pythonExe = "" Then
    pythonExe = FindOnPath("python.exe")
End If

' --- 3. Repli : emplacements d'installation courants ------------------------
If pythonExe = "" Then
    pythonExe = FindInCommonLocations()
End If

' --- 4. Echec : message clair pour l'utilisateur ----------------------------
If pythonExe = "" Then
    MsgBox "Python est introuvable sur ce PC." & vbCrLf & vbCrLf & _
           "Installez Python 3 depuis https://www.python.org/downloads/" & vbCrLf & _
           "en cochant ""Add Python to PATH"", puis relancez install.bat.", _
           vbCritical, "Remote Mouse — Python manquant"
    WScript.Quit 1
End If

' --- Lancement (fenetre cachee, non bloquant) -------------------------------
WshShell.Run """" & pythonExe & """ """ & strLauncher & """", 0, False


' ============================================================================
'  Fonctions utilitaires
' ============================================================================

' Renvoie le chemin complet d'un exe trouve via "where", sinon "".
Function FindOnPath(exeName)
    FindOnPath = ""
    On Error Resume Next
    Set proc = WshShell.Exec("where " & exeName)
    If Err.Number = 0 Then
        line = proc.StdOut.ReadLine()   ' premiere correspondance
        If line <> "" And objFSO.FileExists(line) Then
            FindOnPath = line
        End If
    End If
    On Error GoTo 0
End Function

' Parcourt les emplacements d'installation classiques de Python.
Function FindInCommonLocations()
    FindInCommonLocations = ""
    Dim bases(3)
    bases(0) = WshShell.ExpandEnvironmentStrings("%LocalAppData%") & "\Programs\Python"
    bases(1) = "C:\Program Files\Python"
    bases(2) = "C:\Program Files (x86)\Python"
    bases(3) = "C:\"

    For Each base In bases
        If objFSO.FolderExists(base) Then
            Set folder = objFSO.GetFolder(base)
            ' pythonw.exe directement dans la base (ex. C:\Python313)
            If objFSO.FileExists(base & "\pythonw.exe") Then
                FindInCommonLocations = base & "\pythonw.exe"
                Exit Function
            End If
            ' ou dans un sous-dossier (ex. ...\Python\Python313\pythonw.exe)
            For Each subDir In folder.SubFolders
                If objFSO.FileExists(subDir.Path & "\pythonw.exe") Then
                    FindInCommonLocations = subDir.Path & "\pythonw.exe"
                    Exit Function
                End If
            Next
        End If
    Next
End Function
