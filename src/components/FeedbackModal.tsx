import { useState } from 'react';

// Base64-encoded so address scrapers crawling the public repo don't harvest it
const FEEDBACK_EMAIL = atob('amFyZWRramFyQGdtYWlsLmNvbQ==');
const ENDPOINT = `https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`;
const SUBJECT = 'Video Poker feedback';

interface Props {
  user: string;
  onClose: () => void;
}

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function FeedbackModal({ user, onClose }: Props) {
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const mailtoHref =
    `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(SUBJECT)}` +
    `&body=${encodeURIComponent(message)}`;

  const send = async () => {
    if (!message.trim() || status === 'sending') return;
    setStatus('sending');
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: SUBJECT,
          _template: 'table',
          _captcha: 'false',
          player: user,
          ...(replyTo.trim() ? { _replyto: replyTo.trim() } : {}),
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { success?: boolean | string };
      if (!res.ok || String(data.success) === 'false') throw new Error('send failed');
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>Send Feedback</h2>

        {status === 'sent' ? (
          <>
            <p className="modal-sub feedback-thanks">
              Thanks! Your feedback is on its way to Jared. 🎉
            </p>
            <button type="button" className="send-btn" onClick={onClose}>
              Done
            </button>
          </>
        ) : (
          <>
            <p className="modal-sub">
              Found a bug or have an idea? It goes straight to Jared's inbox.
            </p>
            <textarea
              className="feedback-text"
              rows={5}
              maxLength={2000}
              placeholder="What's on your mind?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              autoFocus
            />
            <input
              className="feedback-email"
              type="email"
              placeholder="Your email (optional, if you'd like a reply)"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
            {status === 'error' && (
              <p className="modal-note">
                Couldn't send right now — try again, or{' '}
                <a href={mailtoHref}>email directly</a>.
              </p>
            )}
            <button
              type="button"
              className="send-btn"
              disabled={!message.trim() || status === 'sending'}
              onClick={() => void send()}
            >
              {status === 'sending' ? 'Sending…' : 'Send feedback'}
            </button>
            <a className="modal-link" href={mailtoHref}>
              Send with your email app instead
            </a>
          </>
        )}
      </div>
    </div>
  );
}
