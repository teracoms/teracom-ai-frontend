import Link from 'next/link';

import { getPortalContactSessionToken } from '@/lib/api/portalContactAuth';
import { ApiError } from '@/lib/api/client';
import {
  fetchPortalContactSupportRequest,
  fetchPortalContactSupportRequestMessages,
} from '@/lib/api/portalContactSupportRequests';
import { settle, errorMessage } from '@/lib/api/results';
import PortalSupportRequestThread from '@/components/customer-portal/PortalSupportRequestThread';

export const metadata = {
  title: 'Support Request | Customer Portal',
};

export default async function CustomerPortalSupportRequestPage({ params }) {
  const { requestId } = params;
  const token = getPortalContactSessionToken();

  if (!token) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Customer Portal</span>
            <h1>Your session has ended.</h1>
            <p className="lead">Please sign in again.</p>
          </div>
        </section>
      </main>
    );
  }

  const [requestSettled, messagesSettled] = await Promise.allSettled([
    fetchPortalContactSupportRequest(token, requestId),
    fetchPortalContactSupportRequestMessages(token, requestId),
  ]);

  const request = settle(requestSettled);

  if (request.error) {
    const notFound = request.error instanceof ApiError && [403, 404].includes(request.error.status);

    return (
      <main>
        <section className="section">
          <div className="container">
            <span className="eyebrow">Customer Portal</span>
            <h1>{notFound ? 'Request not found.' : 'Unable to load this request.'}</h1>
            <p className="lead">{notFound ? "This request doesn't belong to your account." : errorMessage(request.error)}</p>
            <Link className="btn btn-secondary" href="/customer-portal/support">
              Back to Support
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const messages = settle(messagesSettled);

  return (
    <main>
      <section className="section">
        <div className="container">
          {messages.error ? (
            <p className="form-error" role="alert">
              {errorMessage(messages.error)}
            </p>
          ) : (
            <PortalSupportRequestThread request={request.value} messages={messages.value ?? []} />
          )}
        </div>
      </section>
    </main>
  );
}
