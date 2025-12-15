<svelte:head>
	<title>Resume - Adeyemi Folarin</title>
	<meta name="description" content="Cybersecurity professional specializing in technical support and AI model evaluation." />
</svelte:head>

<div class="content-container">
	<div class="resume">
		<header>
			<h1 class="mono primary">Adeyemi Folarin</h1>
			<p class="mono secondary">Toronto, Ontario</p>
			<div class="contact-info">
				<a href="mailto:adeyemfolarin@icloud.com" class="mono tertiary">adeyemfolarin@icloud.com</a>
				<span class="mono tertiary">+1-437-881-9415</span>
			</div>
		</header>

		<section class="section">
			<h2 class="mono primary">Profile</h2>
			<p class="mono secondary">
				Dynamic cybersecurity professional with 2 years of specialized experience in technical support, adept at resolving intricate issues and elevating customer satisfaction. Proficient in incident response and data analysis, leading to substantial enhancements in operational efficiency and resolution times. A solid grounding in cybersecurity principles, coupled with a commitment to threat mitigation, fosters collaborative initiatives aimed at reinforcing security frameworks. Eager to transition into a Cyber and Privacy Intern role, ready to apply technical acumen and contribute to advancing cybersecurity strategies.
			</p>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Experience</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">AI Evaluator</h3>
					<span class="mono tertiary">Nov 2025 - Present</span>
				</div>
				<p class="mono tertiary company">Outlier (Scale AI)</p>
				<ul class="mono secondary">
					<li>Evaluate AI model outputs for accuracy, relevance, and quality across multiple domains</li>
					<li>Provide detailed feedback to improve machine learning model performance</li>
					<li>Assess complex technical responses and identify model hallucinations or inconsistencies</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Technical Support Representative</h3>
					<span class="mono tertiary">Jan 2022 - Feb 2023</span>
				</div>
				<p class="mono tertiary company">Crave Daniels Inc.</p>
				<ul class="mono secondary">
					<li>Analyzed customer behavior patterns related to identity theft via spam calls and weak passwords, implementing targeted educational strategies that improved client awareness by 42%</li>
					<li>Utilized data visualization tools to illustrate operational inefficiencies, supporting strategic decisions that reduced costs by 17%</li>
					<li>Delivered customized troubleshooting plans aligned with client goals and workflows, enhancing resolution speed by 30% and reinforcing client trust</li>
					<li>Developed and implemented security awareness programs to educate clients on best practices in cybersecurity</li>
					<li>Collaborated with cross-functional teams to enhance incident response protocols and improve overall security posture</li>
				</ul>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Customer Service Representative</h3>
					<span class="mono tertiary">Dec 2020 - Dec 2021</span>
				</div>
				<p class="mono tertiary company">Crave Daniels Inc.</p>
				<ul class="mono secondary">
					<li>Translated complex business needs into precise technical solutions, enhancing client satisfaction scores by 25%</li>
					<li>Developed and facilitated over 30 targeted support workshops, improving knowledge management and accelerating project timelines by 15%</li>
					<li>Crafted tailored messaging for diverse audiences, increasing engagement by 40% in collaborative environments</li>
					<li>Implemented incident response protocols, enhancing operational efficiency and issue resolution times</li>
					<li>Engaged in threat mitigation strategies, reinforcing organizational security initiatives</li>
				</ul>
			</div>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Education</h2>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Honor's Bachelors of Technology in Cybersecurity</h3>
					<span class="mono tertiary">Sep 2023 - Oct 2027</span>
				</div>
				<p class="mono secondary">Seneca Polytechnic</p>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">Higher National Diploma</h3>
					<span class="mono tertiary">Apr 2022 - Sep 2022</span>
				</div>
			</div>

			<div class="experience-item">
				<div class="experience-header">
					<h3 class="mono primary">High School Diploma</h3>
					<span class="mono tertiary">Sep 2014 - Jan 2020</span>
				</div>
			</div>
		</section>

		<div class="divider"></div>

		<section class="section">
			<h2 class="mono primary">Technical Skills</h2>
			<div class="skills-grid">
				<div class="skill-category">
					<h3 class="mono primary">Languages</h3>
					<ul class="mono secondary">
						<li>Python</li>
						<li>JavaScript</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Technologies</h3>
					<ul class="mono secondary">
						<li>Git</li>
						<li>Ansible</li>
						<li>Docker</li>
						<li>Linux</li>
						<li>Kubernetes</li>
						<li>Wireshark</li>
					</ul>
				</div>
				<div class="skill-category">
					<h3 class="mono primary">Security Tools</h3>
					<ul class="mono secondary">
						<li>Elastic Stack</li>
						<li>Splunk</li>
						<li>Nmap</li>
						<li>Jenkins</li>
						<li>Metasploit</li>
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
					Member of cybersecurity club where students compete in CTFs and discuss the evolving landscape of cybersecurity.
				</p>
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
