import { LegalPageShell } from './LegalPage'

export default function TermsOfService() {
  return (
    <LegalPageShell title="Terms of Service">
      <p>
        By using Questly, you agree to these Terms of Service. If you do not agree, do not use the service.
      </p>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Service description</h2>
        <p>
          Questly is a team productivity application that syncs tasks from Jira Cloud and adds gamification
          (XP, coins, rewards). The service is provided on an &quot;as is&quot; basis for educational and
          team use.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Your account</h2>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>You are responsible for keeping your login credentials secure.</li>
          <li>You must provide accurate account information.</li>
          <li>Admins are responsible for workspace membership and Jira connection settings.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Jira integration</h2>
        <p>
          Connecting Jira requires valid Atlassian credentials or OAuth consent. You must have permission to
          access the Jira sites and projects you connect. Questly reads Jira data to display and track tasks;
          completion for XP is recorded in Questly and does not automatically change Jira issue status unless
          your team configures that separately.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Acceptable use</h2>
        <p>You agree not to misuse Questly, attempt unauthorized access, or interfere with other users.</p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Disclaimer</h2>
        <p>
          Questly is provided without warranties of any kind. We are not liable for indirect or consequential
          damages arising from use of the service, to the maximum extent permitted by law.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Changes</h2>
        <p>
          We may update these terms. Continued use after changes constitutes acceptance. Material changes will
          be reflected on this page.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Contact</h2>
        <p>Questions about these terms: contact your workspace administrator.</p>
      </section>
    </LegalPageShell>
  )
}
