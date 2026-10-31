---
trigger: always_on
description: Prohibición estricta de usar scripts en Python para editar o inspeccionar archivos; usar siempre herramientas nativas (read_file, edit_file, write_file).
---

# Regla Obligatoria: Edición Directa con Herramientas Nativas (Sin Scripts de Python)

- **NUNCA** crees ni ejecutes scripts en Python (`.py`) ni scripts auxiliares para leer, buscar, modificar o escribir archivos de código del proyecto (`.js`, `.jsx`, `.ts`, `.tsx`, `.css`, `.html`, `.json`, `.md`, etc.).
- **SIEMPRE** utiliza exclusivamente las herramientas nativas del agente (`read_file`, `edit_file`, `write_file`) para inspeccionar y editar archivos directamente, de modo que cada cambio sea transparente, ético y auditable por el usuario.

