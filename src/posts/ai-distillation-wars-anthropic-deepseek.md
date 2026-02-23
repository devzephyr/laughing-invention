---
title: "The AI Wars Are Here: How DeepSeek, Moonshot, and MiniMax Stole 16 Million Conversations from Claude"
description: "Anthropic caught three Chinese AI labs running coordinated model distillation attacks at scale—24,000 fraudulent accounts, 16 million stolen exchanges, and capabilities extraction targeting AI safety research and censorship circumvention. The AI cold war just went hot."
date: "2026-02-23"
tags: ["ai", "distillation", "deepseek", "llm", "model-theft", "security", "anthropic"]
---

## They Just Asked Claude

When DeepSeek dropped R1 in January 2025 and the internet lost its mind over its GPT-4 level performance at a fraction of the training cost, the dominant narrative was "China caught up." Investors panic-sold Nvidia. Tech journalists wrote about the death of American AI dominance. Everyone asked how they did it so fast, so cheap.

One answer, apparently, is that they just asked Claude.

Anthropic published a report this week naming DeepSeek, Moonshot AI, and MiniMax as operators of coordinated, large-scale distillation attacks against Claude. Over 16 million exchanges extracted. 24,000 fraudulent accounts created. Hydra cluster proxy networks distributed across multiple cloud providers specifically to evade detection. These weren't hobbyists poking at an API—these were organized, industrial-scale capability theft operations run by three of China's best-funded AI companies.

This is corporate espionage. It just happens to involve API keys instead of USB drives.

## What Distillation Actually Is

Model distillation is legitimate. You train a smaller model on outputs from a larger one—the "student" learns to approximate the "teacher." OpenAI does it for GPT-4o mini. Anthropic does it for Claude Haiku. Standard practice.

The problem is nothing stops you from using someone else's model as the teacher without permission. Query Claude millions of times, collect the responses, use them as training data. You've just bootstrapped Claude's capabilities into your own model—without the years of research, safety training, RLHF work, or billions in compute that produced those capabilities in the first place.

Distillation attacks are industrial-scale API scraping designed to extract training signal from a frontier model. Not hacking in the traditional sense. Economic espionage with an API key.

## The Three Operations

### DeepSeek: 150,000+ Exchanges

DeepSeek's operation was the smallest by volume but the most targeted. They weren't doing bulk extraction—they were going after specific capabilities:

- **Reasoning chains**: Multi-step problem solving, exactly the capability DeepSeek R1 got praised for
- **Rubric-based grading**: Labeled training data for reinforcement learning pipelines
- **Censorship-safe alternatives**: Claude's responses to politically sensitive Chinese government queries that DeepSeek's own models refuse to answer

That last one is worth sitting with. DeepSeek was asking Claude to answer questions DeepSeek itself couldn't—then training DeepSeek on those answers. They laundered politically sensitive capabilities through Anthropic's API. Built a model that can engage with topics banned in China by extracting the answers from an American company's servers and calling it research.

### Moonshot AI: 3.4 Million Exchanges

Moonshot ran a substantially larger operation focused on agentic capabilities—AI that takes actions rather than just generates text:

- Agentic reasoning and multi-step tool use
- Coding and data analysis workflows
- Computer-use agent development

Moonshot makes Kimi, a popular AI assistant in China. Their targeting profile makes clear they were specifically trying to close the gap on agentic capabilities—the area where Claude has been most differentiated. They didn't just want a chatbot. They wanted a system that could operate autonomously.

### MiniMax: 13 Million Exchanges

MiniMax ran the largest operation by a factor of four. 13 million exchanges—83% of total volume across all three campaigns. Their focus: agentic coding and tool orchestration at scale.

This is the most economically rational play if you're building a coding assistant. Instead of generating your own training data through expensive human annotation, you just query Claude for millions of coding tasks and use the responses as ground truth. You get Claude's quality signal at commodity API prices. Why fund a research team when you can just steal the outputs?

## The Hydra Architecture

The scale isn't even the most interesting part. It's the evasion infrastructure.

These weren't simple API key farms. Anthropic describes the attackers using "commercial proxy services operating hydra cluster architectures." One proxy network managed over 20,000 fraudulent accounts simultaneously, distributing traffic across multiple APIs and cloud platforms to avoid triggering rate limits or abuse detection on any single account.

Hydra architecture: cut off one head, ten more take over. Suspend one account, the query load redistributes across the cluster. Block an IP range, traffic reroutes. The whole design is specifically built to outlast standard abuse response timelines—by the time Anthropic's systems detect a pattern and take action, the pipeline has already moved.

This is not a startup skunkworks project. Coordinated account creation at scale, distributed proxy infrastructure, targeted capability extraction designed around specific training objectives—this is organized, resourced, and intentional. Someone wrote an ops playbook for this.

## The Real Danger: Safety Stripped Out

Distillation attacks don't just steal capabilities. They strip out the safety work.

Claude isn't just a capable model. It's a capable model that's been trained extensively on what not to do: refuse bioweapon synthesis routes, decline to help with cyberweapons, add friction around mass casualty attack planning. That safety training is layered into the model at a fundamental level—it's not a filter bolted on top.

When you distill from Claude, you extract the capability signal. Then you train your own model from scratch—and you don't necessarily do the alignment work. You get the reasoning and coding capabilities without the years of Constitutional AI research, RLHF on safety, and red-teaming that shaped how Claude responds to dangerous requests.

Then those models get open-sourced. Because they keep getting open-sourced. And those unconstrained capabilities become freely available to anyone—state actors, non-state actors, people who want to know how to synthesize things that should require significant expertise and resources to figure out.

Anthropic explicitly flags this risk: illicitly distilled models enabling bioweapon development and cyber operations. Not theoretical. The explicitly stated threat model.

## What Anthropic Is Actually Doing About It

Anthropic's response has several layers:

**Detection systems** identifying distillation attack patterns—volume spikes concentrated on narrow capability clusters, repetitive prompt structures optimized for training data generation, coordinated account behavior across multiple endpoints.

**Intelligence sharing** with other AI companies and law enforcement. Naming these companies publicly in a report is part of that strategy. It's signal to the rest of the industry about what coordinated distillation operations look like so others can build the same detection.

**Strengthened access controls** on educational and research account tiers, which were being abused to get higher rate limits under the cover of legitimate use.

**Product-level safeguards** designed to reduce output efficacy specifically for distillation pipelines without degrading normal use. How exactly that works isn't specified—but it likely involves some combination of watermarking and stylistic poisoning of responses to detected scraping sessions. Making the training signal noisier for anyone running industrial extraction.

## Naming Names Is a Big Deal

Anthropic naming DeepSeek, Moonshot, and MiniMax specifically—by name, in a public report—is a significant escalation. This isn't a vague warning about API abuse policies. It's accusing three well-funded Chinese AI companies of coordinated large-scale theft. In writing. With specifics.

DeepSeek's R1 benchmarks are still impressive. Nobody's taking that away. But there's now a publicly documented record of DeepSeek specifically targeting Claude's reasoning capabilities through a fraudulent account operation shortly before releasing a model with unexpectedly strong reasoning capabilities. Draw your own conclusions.

The AI race has always been about who can build the best models fastest. What this report makes explicit is that "building" sometimes means "extracting." Frontier labs are no longer just competing on research and compute. They're competing on intelligence operations.

## The Fundamental Problem

Anthropic is in a difficult position. Their API is a revenue stream—they need people to use it. But high-volume usage is also the attack surface. Distinguishing legitimate heavy usage from distillation extraction is genuinely hard, and over-aggressive rate limiting punishes the legitimate users who fund the actual research.

The coordination play—sharing detection intelligence across the industry—is the right long-term move. If every frontier lab can identify the same hydra cluster proxies and account creation patterns, the operational cost of running distillation attacks goes up substantially. You can't just buy a proxy service and point it at multiple APIs simultaneously.

But the core tension doesn't go away: the more capable the model, the more valuable it is as a distillation target. As long as there's a capability gap between frontier labs and everyone else, there's an economic incentive to close that gap through extraction instead of research.

Cheaper. Faster. And apparently only now starting to get seriously named and called out.

Welcome to the AI cold war. It was always warmer than advertised.

## References

**Primary Source:**
- [Anthropic: Detecting and Preventing Distillation Attacks](https://www.anthropic.com/news/detecting-and-preventing-distillation-attacks)
