-- SQL INSERTs supplied by the user (adjusted to current schema)

-- PROJECTS
INSERT INTO projects (title, slug, summary, tags, repo_url, live_url, hero_image, created_at) VALUES
('Neutron Multi-VM Lab (AD DS, Docker Host, Router, NetworkServices)', 'neutron-lab-topology',
 'VirtualBox-based lab: Windows Server 2022 AD DS + DNS + DHCP, Ubuntu Router (nftables NAT/masq), DockerHost (containerized services), NetworkServices (Ansible control node). Internal domain: neutron.xyz (and variants used in labs).',
 ARRAY['VirtualBox','AD DS','DNS','DHCP','nftables','Docker','Ansible'], '', '', '', '2025-06-15'),

('Ansible Automation for Neutron', 'neutron-ansible-automation',
 'Playbooks to provision Router, AD DS, DockerHost, and NetworkServices VMs. Control node runs on NetworkServices VM (not the host). Updated README with exact commands; removed pfSense from plan.',
 ARRAY['Ansible','Automation','Linux','Windows Server'], '', '', '', '2025-09-03'),

('ELK Stack Threat-Hunting Setup', 'elk-threat-hunting',
 'Filebeat/Packetbeat/Winlogbeat shipping to Elasticsearch; Kibana dashboards (geo-point mapping, index templates). Troubleshot mapping exceptions and pipeline issues.',
 ARRAY['Elasticsearch','Kibana','Beats','Threat Hunting'], '', '', '', '2025-06-01'),

('Zeek File Extraction Pipeline', 'zeek-file-extraction',
 'Reinstalled Zeek and zkg cleanly; fixed package load errors; configured file carving to capture binaries (EXE) rather than text; set carve output directory and persistence.',
 ARRAY['Zeek','zkg','PCAP','File carving'], '', '', '', '2025-09-08'),

('Reverse Proxy + Containers (Windows cURL testing)', 'reverse-proxy-containers',
 'Deployed containerized services behind a reverse proxy; verified routes with Windows-style cURL commands; tuned rules for the Neutron internal networks.',
 ARRAY['Reverse Proxy','Docker','Networking','Windows'], '', '', '', '2025-09-06'),

('BGP with Bird 2.0 (Filters & Large Communities)', 'bird-bgp-config',
 'Configured Bird 2.0 routers (e.g., as180r) with route filters and large-community handling; versioned configs (bird.conf) and validation steps.',
 ARRAY['BGP','Bird 2.0','Routing'], '', '', '', '2025-05-20');

-- LABS
INSERT INTO labs (title, slug, summary, stack, writeup_md, created_at) VALUES
('SEED Labs — DNS Local Attack Lab', 'seed-dns-local-attack',
 'Completed SEED DNS Local Attack Lab. Built from scratch with step-by-step commands, screenshots, and verification.',
 ARRAY['SEED Labs','Linux networking','DNS'],
 'Goals: local DNS poisoning/attack scenarios; Steps: environment setup, packets/queries inspection, attack execution, mitigation; Evidence: command logs and screenshots; Lessons: resolver behavior and hardening.',
 '2025-04-12'),

('Wireshark (W4SP) — ARP/DHCP/DNS/FTP Credential Theft', 'w4sp-wireshark-attacks',
 'Used Kali 2018.2 W4SP VM to analyze ARP spoofing, DHCP manipulation, DNS interception, and FTP credential theft scenarios. Included Metasploit/dockerized attack flows.',
 ARRAY['Wireshark','Kali W4SP','Metasploit','Docker'],
 'Captured traffic, identified attack signatures, extracted credentials (FTP), and documented remediation measures.',
 '2025-04-12'),

('Promiscuous Mode — Persistent Configuration', 'promisc-persistence',
 'Investigated Ubuntu promiscuous-mode settings to make them reboot-persistent for capture/IDS workloads.',
 ARRAY['Linux','Network interfaces'],
 'Compared runtime vs persistent configs; documented systemd/netplan approaches and verification steps.',
 '2025-09-08'),

('VirtualBox Networking — NAT vs Host-Only (No pfSense)', 'virtualbox-network-design',
 'Redesigned lab networks after removing pfSense: NAT Network with DHCP for internet egress, Host-Only for internal comms; clarified SSH paths for Ansible control node on NetworkServices VM.',
 ARRAY['VirtualBox','Ansible','Linux/Windows'],
 'Diagrammed adapters; documented SSH connectivity from control node; hardened internal DNS and routing.',
 '2025-09-03'),

('ELK Beats → Elasticsearch → Kibana (Geo-Point & Templates)', 'elk-geo-indexing',
 'Set up Beats shippers, resolved document_parsing_exception for geo-point fields via index templates and mapping fixes.',
 ARRAY['Filebeat','Packetbeat','Winlogbeat','Elasticsearch','Kibana'],
 'Template versioning, index lifecycle, and dashboard verification with maps.',
 '2025-06-01');

-- WRITEUPS
INSERT INTO writeups (title, slug, summary, published_at) VALUES
('Fixing Zeek/zkg Package Load Errors for File Carving', 'zeek-zkg-fix-file-carving',
 'Root-caused unknown identifier load errors in Zeek site packages; performed clean reinstall of Zeek and zkg; validated EXE carving.',
 '2025-09-08'),

('Windows cURL Tips for Reverse-Proxy Testing', 'windows-curl-reverse-proxy',
 'Windows-syntax cURL examples to validate reverse proxy routes to containerized services in the Neutron lab.',
 '2025-09-06'),

('VirtualBox Network Plan Without pfSense', 'virtualbox-plan-no-pfsense',
 'Adapter layout, NAT vs host-only, and Ansible connectivity with NetworkServices VM as the control node.',
 '2025-09-03'),

('TVRA Risk Model — Internal Threat Scope (Adeyemi Rows)', 'tvra-internal-threat-scope',
 'Refined Adeyemi-owned rows: internal-only threat sources (deployment not online), clarified threat events and adjusted likelihood/impact.',
 '2025-09-17');

-- READING
INSERT INTO reading (title, author, year, status, notes) VALUES
('NIST SP 800-30 Rev.1 — Risk Management Guide', 'NIST', 2012, 'reference', 'Used for TVRA/risk language and likelihood/impact framing.'),
('NIST SP 800-82 Rev.3 — ICS Security', 'NIST', 2024, 'reference', 'Referenced while discussing sector-specific risks.'),
('SEED Labs — DNS Local Attack Lab Docs', 'SEED Labs', 2025, 'completed', 'Primary guide for the DNS local attack lab.'),
('Zeek Documentation — File Carving & Packages', 'Zeek Project', 2025, 'in_progress', 'Used during reinstall and file extraction configuration.'),
('Elastic Stack Docs — Beats, Mappings, Geo-point', 'Elastic', 2025, 'in_progress', 'For fixing geo-point mapping and index templates in Kibana.'),
('Bird 2.0 Documentation — BGP & Filters', 'Bird Project', 2025, 'reference', 'Consulted for BGP filters and large-communities config.');

