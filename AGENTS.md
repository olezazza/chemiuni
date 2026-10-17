<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# ChemiUni rules
- The phone app remains under expo/ with the existing visual system and all program records in expo/lib/data.ts; the web artifact is the secure service only — why: preserve the established mobile experience.
- Estimates remain deterministic in expo/lib/engine.ts; authenticated public routes call the Gateway SDK — why: AI must not change scoring or expose secrets.
- Accepted counselor changes opt into an explicit approvedList snapshot; legacy buildList ranking is unchanged otherwise — why: approved removals must not refill and replacements must preserve their slot.
- Conversation and decisions persist atomically with the profile in AsyncStorage; optional fields preserve older saves — why: no detached approvals or lost student data.
- Native chat uses React Native controls and markdown instead of AI Elements DOM primitives (registry uses div and HTMLAttributes) — why: iOS and Android require native rendering.
- Appearance uses the existing provider, theme tokens and bundled Georgian fonts — why: preserve light/dark identity and immediate switching.
- Onboarding enters scores with a single replacement; saved forms use the shared empty-stack fallback before dispatching back — why: reloads and deep links have no prior screen.
- Expo tsconfig extends the committed local expo/tsconfig.base.json, never the expo package path — why: Expo tooling re-adds a package extends when none exists, and publishing builds without expo/node_modules.
- The counselor gets a silent anonymous guest session per device; backend routes still verify the signed JWT — why: no separate account while keeping the AI endpoint authenticated.
- Counselor requests send a bounded grounded context (listed programs plus top candidates, recent turns only) and the server accepts proposals only for supplied rows — why: keeps AI cost low without letting the model cite unseen programs.
