# Architecture rules
- Render About Us through the existing SiteViewer route, not the dashboard tool cards, so iframe permissions and language propagation remain shared.
- Keep auth a single scrollable, logo-led dark screen; scope its landscape and green-horizon colors to semantic auth tokens so other pages retain theme support.
- Share signup agreement validation between email and Google signup controls so neither signup action bypasses reading and acceptance.
- Keep password recovery public and use Cloud Auth recovery tokens; only a verified recovery session may update the password, never a browser-generated code.