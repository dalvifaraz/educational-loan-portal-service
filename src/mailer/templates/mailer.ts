import { resend } from './resendClient';
import { config } from '../../config/app.config';

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};

const mailer_sender =
  config.NODE_ENV === 'development'
    ? `no-reply <onboarding@resend.dev>`
    : `no-reply <${config.MAILER_SENDER}>`;

export const sendMail = async ({
  to,
  subject,
  text,
  html,
  from = mailer_sender,
}: Params) =>
  await resend.emails.send({
    from,
    to: Array.isArray(to) ? to : [to],
    text,
    subject,
    html,
  });
