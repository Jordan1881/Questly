import { LegalPageShell } from './LegalPage'

export default function PrivacyPolicy() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p>
        Questly (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) provides a gamified task management
        experience that integrates with Atlassian Jira. This policy describes what data we collect, how we
        use it, and your choices.
      </p>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Information we collect</h2>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Account information you provide (email, username, role).</li>
          <li>Workspace membership and task completion activity within Questly.</li>
          <li>
            Jira integration data when you connect: Atlassian account ID, API tokens or OAuth tokens, and
            task metadata synced from your team&apos;s Jira project.
          </li>
          <li>Technical logs required to operate the service (errors, request metadata).</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">How we use information</h2>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Authenticate you and provide Questly features.</li>
          <li>Sync Jira issues assigned to you and award XP/coins when you complete tasks in Questly.</li>
          <li>Maintain security, prevent abuse, and improve reliability.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Jira and Atlassian data</h2>
        <p>
          When you connect Jira, Questly stores credentials and your Atlassian account ID to map Jira
          assignees to Questly users. We do not modify your Jira issues except through normal Jira API
          read access used for sync. Tokens are encrypted at rest when{' '}
          <code className="text-[13px] bg-[#f3f4f6] px-1 rounded">JIRA_TOKEN_ENCRYPTION_KEY</code> is
          configured.
        </p>
        <p>
          We comply with Atlassian&apos;s personal data requirements by reporting stored account IDs via
          the Atlassian Personal Data Reporting API and erasing data when required.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Data retention and deletion</h2>
        <p>
          You may disconnect Jira at any time from your Profile. Workspace admins may disconnect team Jira
          from Admin. You may request account deletion by contacting support; we will remove personal data
          within a reasonable period unless retention is required by law.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Third-party services</h2>
        <p>
          Questly uses Atlassian Jira Cloud APIs, hosting providers (Vercel, Railway), and PostgreSQL for
          data storage. Each provider processes data according to its own policies.
        </p>
      </section>

      <section>
        <h2 className="text-[16px] font-semibold text-[#1f2937] mb-2">Contact</h2>
        <p>Questions about this policy: contact your workspace administrator.</p>
      </section>
    </LegalPageShell>
  )
}
