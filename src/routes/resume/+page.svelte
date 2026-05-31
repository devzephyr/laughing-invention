<svelte:head>
	<title>Resume - Adeyemi Folarin</title>
	<meta name="description" content="Cybersecurity student specializing in SIEM-based threat detection, digital forensics, and security assessment. Available Fall 2026 for co-op." />
</svelte:head>

<div class="content-container">
	<div class="resume">
		<header>
			<h1 class="mono primary">Adeyemi Folarin</h1>
			<p class="mono secondary">North York, ON</p>
			<div class="contact-info">
				<a href="mailto:folarinabdul30@gmail.com" class="mono tertiary">folarinabdul30@gmail.com</a>
				<span class="mono tertiary">+1-437-881-9415</span>
			</div>
		</header>

		<section class="section">
			<h2 class="mono primary">Profile</h2>
			<p class="mono secondary">
				Cybersecurity student with hands-on experience in SIEM-based threat detection, digital forensics, and security assessment. Comfortable building detection rules, investigating simulated incidents, and documenting findings for technical and non-technical audiences. Two years of security-focused client work at Crave Daniel's, currently evaluating AI model outputs at Outlier. Available Fall 2026 for a co-op placement.
			</p>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Experience</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">AI Model Evaluator</h3>
					<span class="mono tertiary">Nov 2025 - Present</span>
				</div>
				<p class="mono tertiary company">Outlier</p>
				<ul class="mono secondary">
					<li>Evaluated AI model outputs for factual accuracy and reasoning quality across technical and general-domain tasks</li>
					<li>Assessed computer use and vision model outputs for task completion accuracy and visual reasoning across multi-step agentic workflows</li>
					<li>Documented findings and edge cases in structured written reports to inform model improvements</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Application Security Associate</h3>
					<span class="mono tertiary">Jan 2022 - Feb 2023</span>
				</div>
				<p class="mono tertiary company">Crave Daniel's Inc, Lagos, Nigeria</p>
				<ul class="mono secondary">
					<li>Supported customers on issues involving identity theft, credential abuse, and account security</li>
					<li>Delivered phishing awareness and authentication guidance to non-technical users, reducing repeat security incidents through targeted education</li>
					<li>Collaborated cross-functionally with team leads to refine support workflows and improve case handling efficiency</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Cyber Security Intern</h3>
					<span class="mono tertiary">Dec 2020 - Dec 2021</span>
				</div>
				<p class="mono tertiary company">Crave Daniel's Inc, Lagos, Nigeria</p>
				<ul class="mono secondary">
					<li>Resolved security-related customer cases in a high-volume environment, consistently meeting resolution targets</li>
					<li>Ran knowledge-transfer sessions for peers, improving team response consistency across security-related cases</li>
					<li>Produced data visualizations of support trends for weekly review sessions, enabling data-driven workflow adjustments</li>
				</ul>
			</div>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Education</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Honours Bachelor of Information Technology, Cybersecurity</h3>
					<span class="mono tertiary">Expected August 2027</span>
				</div>
				<p class="mono secondary">Seneca Polytechnic, Toronto, ON</p>
				<p class="mono tertiary coursework">
					Relevant Coursework: Intro to Digital Forensics and Incident Response, Detection and Threat Hunting, Security Operations, Data Classification and Risk Management, Machine Learning for Security, Web Application Security, Penetration Testing, Attack and Defense (in progress)
				</p>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Diploma, Information Systems Management</h3>
					<span class="mono tertiary">April 2022</span>
				</div>
				<p class="mono secondary">Aptech Learning, Lagos, Nigeria</p>
			</div>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Projects</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Threat Hunting and SIEM Detection</h3>
					<span class="mono tertiary">SPR600, Winter 2026</span>
				</div>
				<p class="mono tertiary company">Wazuh, Elastic Stack, Suricata, Python</p>
				<ul class="mono secondary">
					<li>Built custom Wazuh detection rules and Suricata IDS signatures mapped to MITRE ATT&amp;CK techniques; tuned correlation thresholds to reduce alert noise while preserving detection coverage across a four-VM lab environment</li>
					<li>Developed Python threat-hunting scripts and Elastic ML anomaly-detection jobs against large HTTP log datasets; documented findings in structured incident reports</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Digital Forensics and Incident Response</h3>
					<span class="mono tertiary">SPR400, Winter 2025</span>
				</div>
				<p class="mono tertiary company">Splunk</p>
				<ul class="mono secondary">
					<li>Wrote custom Splunk SPL searches and built dashboards correlating authentication, process creation, and network event data; configured detection alerts against simulated intrusion data to surface lateral movement and credential abuse</li>
					<li>Documented investigation steps and findings in structured incident reports for technical and non-technical audiences</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Web Application Security Assessment</h3>
					<span class="mono tertiary">2025 - 2026</span>
				</div>
				<p class="mono tertiary company">Burp Suite Professional, OWASP ZAP, crAPI, Python</p>
				<ul class="mono secondary">
					<li>Completed 40+ PortSwigger Web Security Academy labs spanning authentication, JWT, OAuth 2.0, business logic, and access control vulnerability classes</li>
					<li>Produced a 37-page penetration testing report with full OWASP WSTG methodology mapping, written for technical and executive audiences</li>
				</ul>
			</div>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Technical Skills</h2>
			<div class="skills-grid">
				<div class="skill-category">
					<h3 class="mono primary">SIEM and Detection</h3>
					<ul class="mono secondary">
						<li>Splunk (SPL, dashboards, alerts)</li>
						<li>Elastic Stack (Elasticsearch, Logstash, Kibana)</li>
						<li>Wazuh</li>
						<li>Suricata</li>
						<li>Zeek</li>
						<li>Sigma</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Threat Analysis</h3>
					<ul class="mono secondary">
						<li>Threat hunting</li>
						<li>Log correlation</li>
						<li>MITRE ATT&amp;CK</li>
						<li>Wireshark</li>
						<li>Nmap</li>
						<li>PCAP analysis</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">EDR and Endpoint</h3>
					<ul class="mono secondary">
						<li>Microsoft Defender for Endpoint</li>
						<li>Velociraptor</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Security Assessment</h3>
					<ul class="mono secondary">
						<li>Burp Suite Professional</li>
						<li>OWASP ZAP</li>
						<li>Metasploit</li>
						<li>OWASP Top 10</li>
						<li>OWASP WSTG</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Programming</h3>
					<ul class="mono secondary">
						<li>Python</li>
						<li>Bash</li>
						<li>PowerShell</li>
						<li>JavaScript/TypeScript</li>
						<li>Go</li>
						<li>SQL</li>
						<li>Git</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Frameworks</h3>
					<ul class="mono secondary">
						<li>NIST CSF</li>
						<li>ISO/IEC 27001</li>
						<li>CIS Controls</li>
						<li>Zero Trust Architecture</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Platforms</h3>
					<ul class="mono secondary">
						<li>Kali Linux</li>
						<li>Ubuntu</li>
						<li>Windows Server 2019</li>
						<li>Docker</li>
					</ul>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Extra-curricular</h2>
			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Member, Cyber Café Club</h3>
					<span class="mono tertiary">Nov 2024 - Present</span>
				</div>
				<p class="mono secondary">Seneca Polytechnic, Toronto</p>
				<p class="mono secondary">
					CTF competitions and collaborative security challenges.
				</p>
				<ul class="mono secondary">
					<li>MetaCTF April 2026 Flash CTF: 95th out of 1,264 competitors (top 7.5%)</li>
				</ul>
			</div>
		</section>
	</div>
</div>

<style>
	.resume {
		max-width: 800px;
		margin: 0 auto;
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

	.coursework {
		margin-top: var(--spacing-2);
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
