import { getSessionToken } from '@/lib/api/auth';
import { decodeJwtPayload } from '@/lib/api/jwt';
import { isAtLeastRole } from '@/lib/roles';
import { fetchAIProviderConfig, fetchProviderHealth } from '@/lib/api/aiProviderConfig';
import { fetchAIProviderCredentials } from '@/lib/api/aiProviderCredentials';
import { fetchAIProviderRoutingRules } from '@/lib/api/aiProviderRoutingRules';
import { fetchModelEconomicsComparison } from '@/lib/api/modelEconomics';
import AIProviderConfigCard from '@/components/portal/AIProviderConfigCard';
import AIProviderCredentialsPanel from '@/components/portal/AIProviderCredentialsPanel';
import AIProviderRoutingRulesEditor from '@/components/portal/AIProviderRoutingRulesEditor';
import ModelEconomicsComparison from '@/components/portal/ModelEconomicsComparison';
import ProviderHealthPanel from '@/components/portal/ProviderHealthPanel';

export const metadata = {
  title: 'AI Providers | Teracom AI Portal',
};

/**
 * MODELROUTE1 -- the full AI Provider settings surface: routing mode
 * (Mode A/B/C/D), cloud provider credentials, and the Custom Routing
 * order editor (only meaningful once Mode D is selected). Supersedes
 * the inline AIProviderConfigCard on admin/organisation/page.js, which
 * now links here instead of embedding the (now larger) card directly.
 */
export default async function AIProvidersPage() {
  const token = getSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">AI Providers</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  if (!isAtLeastRole(decodeJwtPayload(token)?.role, 'admin')) {
    return null;
  }

  let config = null;
  let credentials = [];
  let rules = [];
  let comparison = [];
  let providerHealth = [];
  let loadError = null;

  try {
    config = await fetchAIProviderConfig(token);
    credentials = await fetchAIProviderCredentials(token);
    rules = await fetchAIProviderRoutingRules(token);
    comparison = await fetchModelEconomicsComparison(token);
    providerHealth = await fetchProviderHealth(token);
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Unable to load AI provider settings.';
  }

  return (
    <main>
      <section className="hero hero-product">
        <div className="container">
          <div className="hero-copy">
            <span className="eyebrow">AI Providers</span>
            <h1>AI provider routing.</h1>
            <p className="lead">
              Teracom AI (Ollama) is this organisation&apos;s own primary, self-hosted model.
              Configure whether — and how — a real cloud provider is ever used instead.
            </p>
          </div>
        </div>
      </section>

      {loadError ? (
        <section className="section">
          <div className="container">
            <p className="form-error" role="alert">
              {loadError}
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="section">
            <div className="container">
              <div className="section-heading left">
                <span className="eyebrow">Routing mode</span>
                <h2>How requests are routed.</h2>
              </div>
              <AIProviderConfigCard config={config} />
            </div>
          </section>

          <section className="section alt">
            <div className="container">
              <div className="section-heading left">
                <span className="eyebrow">Provider Health</span>
                <h2>Is each provider reachable right now?</h2>
                <p>
                  A live check, made fresh every time this page loads — distinct from historical
                  availability below, since a healthy provider can still be slow under real load.
                </p>
              </div>
              <ProviderHealthPanel statuses={providerHealth} />
            </div>
          </section>

          <section className="section alt">
            <div className="container">
              <div className="section-heading left">
                <span className="eyebrow">Credentials</span>
                <h2>Cloud provider API keys.</h2>
                <p>
                  Your own keys, encrypted, never returned by this or any other screen once saved.
                  OpenRouter is entirely optional.
                </p>
              </div>
              <AIProviderCredentialsPanel credentials={credentials} />
            </div>
          </section>

          {config?.routing_mode === 'custom' && (
            <section className="section">
              <div className="container">
                <div className="section-heading left">
                  <span className="eyebrow">Custom Routing</span>
                  <h2>Your own fallback order.</h2>
                  <p>Tried top to bottom; the first one that succeeds wins.</p>
                </div>
                <AIProviderRoutingRulesEditor rules={rules} />
              </div>
            </section>
          )}

          <section className="section alt">
            <div className="container">
              <div className="section-heading left">
                <span className="eyebrow">Best Available</span>
                <h2>Real provider comparison.</h2>
                <p>What Best Available mode actually ranks on — nothing fabricated.</p>
              </div>
              <ModelEconomicsComparison rows={comparison} />
            </div>
          </section>
        </>
      )}
    </main>
  );
}
