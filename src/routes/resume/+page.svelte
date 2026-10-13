<script lang="ts">
	import Seo from '$lib/Seo.svelte';
	import { emailLink } from '$lib/email';
</script>

<Seo title="Resume · Adeyemi Folarin" description="Honours BTech Cybersecurity student at Seneca Polytechnic and credited reporter on 9 public GitHub security advisories. Available January - April 2027 for a 4-month co-op in Toronto/GTA." />

<div class="content-container">
	<div class="resume">
		<header>
			<h1 class="mono primary">Adeyemi Folarin</h1>
			<p class="mono secondary">North York, ON</p>
			<div class="contact-info">
				{@html emailLink(undefined, 'mono tertiary')}
				<a class="mono tertiary" href="https://github.com/devzephyr" rel="noopener">github.com/devzephyr</a>
				<a class="mono tertiary" href="https://adeyemi.xyz" rel="noopener">adeyemi.xyz</a>
				<a class="mono tertiary" href="https://www.linkedin.com/in/adeyemi-folarin" rel="noopener">linkedin.com/in/adeyemi-folarin</a>
			</div>
		</header>

		<section class="section">
			<h2 class="mono primary">Profile</h2>
			<p class="mono secondary">
				Honours BTech Cybersecurity student at Seneca Polytechnic and credited reporter on 9 public GitHub security advisories, including a cross-tenant data read in Trigger.dev and a High-severity DoS in npm toml. Builds DevSecOps CI with GitHub Actions, CodeQL and Semgrep, and automates labs with Ansible and Python. Available January - April 2027 for a 4-month co-op in Toronto/GTA.
			</p>
		</section>

		<section class="section">
			<h2 class="mono primary">Experience</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Student Consultant, Innovation Work Integrated Learning (InnWIL)</h3>
					<span class="mono tertiary">Sep 2026 - Present</span>
				</div>
				<p class="mono tertiary company">Seneca Polytechnic HELIX, Toronto, ON (Hybrid)</p>
				<ul class="mono secondary">
					<li>Consult for Hospall with a 4-person Agile team inside a 16-student cohort.</li>
					<li>Frame the industry partner's challenge, compare options and deliver evidence-based recommendations.</li>
					<li>Plan delivery toward a written proposal and final pitch for technical and non-technical audiences.</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">AI Model Evaluator</h3>
					<span class="mono tertiary">Nov 2025 - Feb 2026</span>
				</div>
				<p class="mono tertiary company">Outlier, Remote</p>
				<ul class="mono secondary">
					<li>Evaluated AI model outputs for factual accuracy and reasoning quality across technical tasks.</li>
					<li>Ran audio, visual and text QA across several projects.</li>
					<li>Documented findings and edge cases in structured reports.</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Application Security Associate</h3>
					<span class="mono tertiary">Jan 2022 - Feb 2023</span>
				</div>
				<p class="mono tertiary company">Crave Daniel's Inc, Lagos, Nigeria</p>
				<ul class="mono secondary">
					<li>Investigated 274 identity-theft, unauthorized-access and credential-abuse cases with root-cause analysis on each.</li>
					<li>Briefed non-technical stakeholders on findings and remediation; wrote reports for management review.</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Cyber Security Intern</h3>
					<span class="mono tertiary">Dec 2020 - Dec 2021</span>
				</div>
				<p class="mono tertiary company">Crave Daniel's Inc, Lagos, Nigeria</p>
				<ul class="mono secondary">
					<li>Monitored security event logs and escalated anomalous activity.</li>
					<li>Tracked vulnerability-scan remediation to keep systems audit-ready.</li>
				</ul>
			</div>
		</section>

		<section class="section research">
			<h2 class="mono primary">Security Research</h2>
			<p class="mono tertiary company">Credited reporter, GitHub: devzephyr</p>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">npm toml <a href="https://github.com/BinaryMuse/toml-node/security/advisories/GHSA-9j65-hcg3-gc64" rel="noopener">GHSA-9j65-hcg3-gc64</a></h3>
					<span class="mono tertiary">Oct 2026</span>
				</div>
				<p class="mono tertiary company">High</p>
				<p class="mono secondary">Quadratic DoS in toml.parse() on long dotted keys; fixed in 5.0.1; shared credit. <a href="/blog/toml-node-quadratic-dotted-keys">Write-up</a></p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Trigger.dev <a href="https://github.com/triggerdotdev/trigger.dev/security/advisories/GHSA-m79r-84cc-xwg9" rel="noopener">GHSA-m79r-84cc-xwg9</a></h3>
					<span class="mono tertiary">Oct 2026</span>
				</div>
				<p class="mono tertiary company">Moderate 6.5</p>
				<p class="mono secondary">Tenant-filter bypass in query table placeholders allowed cross-tenant data reads; fixed in 4.7.3. <a href="/blog/trigger-dev-tsql-placeholder-tenant-bypass">Write-up</a></p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">FacturaScripts <a href="https://github.com/NeoRazorX/facturascripts/security/advisories/GHSA-grw9-xvv2-5623" rel="noopener">GHSA-grw9-xvv2-5623</a></h3>
					<span class="mono tertiary">Oct 2026</span>
				</div>
				<p class="mono tertiary company">Critical 9.9</p>
				<p class="mono secondary">Path traversal in SendMail attachments allowed arbitrary file read/move by employee-level users; fixed in 2026.7. <a href="/blog/facturascripts-sendmail-traversal-deploy-token">Write-up</a></p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">FacturaScripts <a href="https://github.com/NeoRazorX/facturascripts/security/advisories/GHSA-jrgg-j699-qm3h" rel="noopener">GHSA-jrgg-j699-qm3h</a></h3>
					<span class="mono tertiary">Oct 2026</span>
				</div>
				<p class="mono tertiary company">High 7.5</p>
				<p class="mono secondary">Predictable Deploy token allowed unauthenticated plugin disable/rebuild; fixed in 2026.7; co-credited.</p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">mcp-from-openapi <a href="https://github.com/agentfront/mcp-from-openapi/security/advisories/GHSA-rm2m-wfw5-7wp5" rel="noopener">GHSA-rm2m-wfw5-7wp5</a></h3>
					<span class="mono tertiary">Sep 2026</span>
				</div>
				<p class="mono tertiary company">Moderate 6.8</p>
				<p class="mono secondary">DNS TOCTOU bypassed the SSRF guard meant to block internal services and cloud metadata; fixed in 2.8.0. <a href="/blog/mcp-from-openapi-ssrf-dns-toctou">Write-up</a></p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Payload alt-text plugin <a href="https://github.com/jhb-software/payload-plugins/security/advisories/GHSA-3pmw-vxv3-8vgq" rel="noopener">GHSA-3pmw-vxv3-8vgq</a></h3>
					<span class="mono tertiary">Sep 2026</span>
				</div>
				<p class="mono tertiary company">Moderate 4.3</p>
				<p class="mono secondary">Health report ignored row-level read access and exposed other tenants' counts and document IDs to any logged-in user; fixed in 0.13.0. <a href="/blog/payload-alt-text-health-row-level-bypass">Write-up</a></p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Argos CI <a href="https://github.com/argos-ci/argos-javascript/security/advisories/GHSA-28pg-v3hp-9g7f" rel="noopener">GHSA-28pg-v3hp-9g7f</a></h3>
					<span class="mono tertiary">Sep 2026</span>
				</div>
				<p class="mono tertiary company">Moderate 6.8</p>
				<p class="mono secondary">Debug logging leaked GITHUB_TOKEN, OIDC request token and ARGOS_TOKEN into CI logs; fixed in @argos-ci/core 6.8.5. <a href="/blog/argos-debug-mode-leaks-ci-tokens">Write-up</a></p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Argos CI <a href="https://github.com/argos-ci/argos-javascript/security/advisories/GHSA-q9j4-4h4j-mv5m" rel="noopener">GHSA-q9j4-4h4j-mv5m</a></h3>
					<span class="mono tertiary">Sep 2026</span>
				</div>
				<p class="mono tertiary company">Low 3.1</p>
				<p class="mono secondary">Unsanitized ANSI/control characters in OAuth error output; fixed in @argos-ci/cli 6.9.4.</p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Kimai CVE-2026-80194 / <a href="https://github.com/kimai/kimai/security/advisories/GHSA-pvc4-crg3-gj44" rel="noopener">GHSA-pvc4-crg3-gj44</a></h3>
					<span class="mono tertiary">Aug 2026</span>
				</div>
				<p class="mono tertiary company">Low (GitHub), 4.3 Medium (NVD CVSS 3.1)</p>
				<p class="mono secondary">Missing authorization exposed data (CWE-862/200); fixed in 2.64.0. <a href="/blog/kimai-export-authorization-bypass">Write-up</a></p>
			</div>
		</section>

		<section class="section">
			<h2 class="mono primary">Projects</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Brampton SecOps Hackathon 2026, 3rd place</h3>
					<span class="mono tertiary">Sep 2026</span>
				</div>
				<p class="mono tertiary company">SupplyChek, Rogers Cybersecure Catalyst / TMU</p>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">DevSecOps CI Pipeline</h3>
					
				</div>
				<p class="mono tertiary company">GitHub Actions, CodeQL, Semgrep</p>
				<ul class="mono secondary">
					<li>Built a pipeline that runs build and test jobs, CodeQL and Semgrep SAST, and dependency checks; surfaced the Kimai access-control bugs.</li>
				</ul>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Ansible Automation Lab</h3>
					
				</div>
				<p class="mono tertiary company">Ansible, Python, Lisp, Linux</p>
				<ul class="mono secondary">
					<li>Automated 7 hosts across 4 VLANs; wrote self-adapting playbooks in Python and Lisp that respond to the attack situation.</li>
				</ul>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">AI Sandbox Hosting</h3>
					
				</div>
				<p class="mono tertiary company">Railway, Docker</p>
				<ul class="mono secondary">
					<li>Operate microVM segmentation for AI sandboxing alongside Docker services; host this blog on Vercel.</li>
				</ul>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Horse Tinder API</h3>
					
				</div>
				<p class="mono tertiary company">Python, FastAPI, pytest</p>
				<ul class="mono secondary">
					<li>Developed a REST backend with OWASP API Security Top 10 mitigations, verified by 154 pytest tests.</li>
				</ul>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Azure Load Balancer</h3>
					
				</div>
				<p class="mono tertiary company">Azure (free tier)</p>
				<ul class="mono secondary">
					<li>Set up a simple load balancer.</li>
				</ul>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Detection Lab and Threat Hunting</h3>
					<span class="mono tertiary">SPR600, Winter 2026</span>
				</div>
				<p class="mono tertiary company">Splunk, Wazuh, Sysmon, Suricata, Elastic ML</p>
				<ul class="mono secondary">
					<li>Configured a 4-VM lab; wrote lateral-movement and privilege-escalation rules; correlated multi-source alerts into weekly reports.</li>
				</ul>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Vulnerability and Threat Analysis</h3>
					<span class="mono tertiary">RIS430, Winter 2025</span>
				</div>
				<p class="mono tertiary company">Windows, Linux</p>
				<ul class="mono secondary">
					<li>Conducted authenticated scans on Windows and Linux hosts, prioritized findings by CVSS, and mapped remediation to CIS Controls and NIST CSF with a risk register.</li>
				</ul>
			</div>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Web Application Security Assessment</h3>
					
				</div>
				<p class="mono tertiary company">Burp Suite, OWASP ZAP</p>
				<ul class="mono secondary">
					<li>Completed PortSwigger Web Security Academy labs on authentication, JWT, OAuth 2.0, business logic and access control; wrote a penetration testing report mapped to OWASP WSTG.</li>
				</ul>
			</div>
		</section>

		<section class="section">
			<h2 class="mono primary">Education</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Honours Bachelor of Technology (Cybersecurity)</h3>
					<span class="mono tertiary">Sep 2023 - Expected Aug 2027</span>
				</div>
				<p class="mono secondary">Seneca Polytechnic, Toronto</p>
				<p class="mono secondary note">President's Honour List, Summer 2026.</p>
				<p class="mono tertiary coursework">
					Coursework: Attack and Defense, Application Security Methodology, Social Engineering, Ethics and Law, Web Security, Security Assessment, Detection, Security Defenses, Privacy and Confidentiality, Web Application Scripting, Vulnerability/Threat Analysis, Network Security, Intro to DFIR, Endpoint Security, Enterprise Infrastructure and Security, Basic Cryptography.
				</p>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Diploma in Information Systems Management</h3>
					<span class="mono tertiary">Apr 2021 - Apr 2022</span>
				</div>
				<p class="mono secondary">Aptech Learning, Lagos, Nigeria</p>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Project Management Ready course (PMI)</h3>
					<span class="mono tertiary">Oct 2026</span>
				</div>
				<p class="mono secondary">XperienceEd. Course completed.</p>
			</div>
		</section>

		<section class="section">
			<h2 class="mono primary">Skills</h2>
			<div class="skills-grid">
				<div class="skill-category">
					<h3 class="mono primary">AppSec and Research</h3>
					<ul class="mono secondary">
						<li>Burp Suite</li>
						<li>OWASP ZAP</li>
						<li>OWASP Top 10</li>
						<li>Access-control analysis</li>
						<li>CVSS</li>
						<li>Responsible disclosure</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">DevSecOps and CI/CD</h3>
					<ul class="mono secondary">
						<li>GitHub Actions</li>
						<li>CodeQL</li>
						<li>Semgrep</li>
						<li>Dependency scanning</li>
						<li>Git</li>
						<li>pytest</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Detection and Response</h3>
					<ul class="mono secondary">
						<li>Splunk (SPL)</li>
						<li>Wazuh</li>
						<li>Elastic Stack</li>
						<li>Suricata</li>
						<li>Zeek</li>
						<li>Sigma</li>
						<li>Sysmon</li>
						<li>Microsoft Defender for Endpoint</li>
						<li>Velociraptor</li>
						<li>Wireshark</li>
						<li>Nmap</li>
						<li>MITRE ATT&amp;CK</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Vulnerability Management</h3>
					<ul class="mono secondary">
						<li>OpenVAS</li>
						<li>Nessus</li>
						<li>Qualys</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Automation and Languages</h3>
					<ul class="mono secondary">
						<li>Python</li>
						<li>Bash</li>
						<li>PowerShell</li>
						<li>Go</li>
						<li>SQL</li>
						<li>Lisp</li>
						<li>Ansible</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Cloud and Platforms</h3>
					<ul class="mono secondary">
						<li>Docker</li>
						<li>Railway</li>
						<li>Vercel</li>
						<li>Azure (free tier)</li>
						<li>Linux</li>
						<li>Windows</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">GRC and Process</h3>
					<ul class="mono secondary">
						<li>NIST CSF</li>
						<li>ISO/IEC 27001</li>
						<li>CIS Controls</li>
						<li>Risk registers</li>
						<li>Agile</li>
						<li>Jira</li>
					</ul>
				</div>
			</div>
		</section>

		<section class="section">
			<h2 class="mono primary">Activities</h2>
			<ul class="mono secondary activities">
				<li>MetaCTF Flash CTF, Apr 2026: 95th of 1,264 (top 7.5%)</li>
				<li>Cyber Café Club (CTF), Seneca, Nov 2024 - Present</li>
				<li>OWASP Toronto Chapter member</li>
			</ul>
		</section>
	</div>
</div>

<style>
	.resume {
		padding: var(--spacing-16) var(--spacing-4);
	}

	header {
		margin-bottom: var(--spacing-12);
	}

	header h1 {
		margin-bottom: var(--spacing-2);
		font-size: var(--text-2xl);
	}

	.contact-info {
		display: flex;
		gap: var(--spacing-4);
		flex-wrap: wrap;
		margin-top: var(--spacing-3);
	}

	.section h2 {
		margin-bottom: var(--spacing-6);
		font-size: var(--text-xl);
	}

	.skills-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: var(--spacing-8);
	}

	.skill-category h3 {
		margin-bottom: var(--spacing-3);
		font-size: var(--text-base);
	}

	.skill-category ul {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.experience-item {
		margin-bottom: var(--spacing-8);
	}

	.experience-item:last-child {
		margin-bottom: 0;
	}

	.experience-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: var(--spacing-2);
		flex-wrap: wrap;
		gap: var(--spacing-2);
	}

	.experience-header h3 {
		font-size: var(--text-lg);
	}

	.company {
		margin-bottom: var(--spacing-3);
	}

	.coursework,
	.note {
		margin-top: var(--spacing-2);
	}

	.contact-info :global(a),
	.research a {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.activities {
		list-style: disc;
		padding-left: var(--spacing-6);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	.experience-item ul {
		list-style: disc;
		padding-left: var(--spacing-6);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-2);
	}

	@media (max-width: 768px) {
		.resume {
			padding: var(--spacing-8) var(--spacing-4);
		}

		.skills-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
