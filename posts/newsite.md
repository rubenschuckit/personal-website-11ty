---
title: My Site 2.0
summary: Rewriting from Angular to 11ty
date: 2020-04-09
tags:
  - tech
---

Everyone seems to be brushing off their side projects during this pandemic, so I thought I would too.

Towards the middle of last year, I began working on my personal website and I built it in Angular. I used Angualar at work and am a big fan. But at the end of the day, it felt a little heavy for what I needed. 

What I really need is a framework that can pre-render my pages (read: a static site generator ). There's a lot of exicting work going on with Angular pre-rendering (not just SSR), but it's in its early stages. Especially since I wanted to include a blog with minimal effort, it makes sense for me to store the MD files in my Git repo and have them translated to HTML **before** its served to you.

I didn't want to set up an external DB or headless CMS. And I accomplished this in Angular, but whenever you would load a blog page it would grab the static MD file and then translate it to HTML in your browser. It's fast and probably not even that much slower than what I have now. But it was kind of wasteful to have that translation occur *every* time when that content literally never changes and could be done once. So...I decied to switch to 11ty. 

11ty is far more suited to what I need (although I do miss that SPA factor). And the site actually looks exactly the same! There was some unrolling to do since I no longer get things like components with content projection, but this personal site doesn't need to worry too much about scale. It also gave me an excuse to try Netlify, which has killer features like deployment previews with PRs. And I can add blog posts, build, and then easily redeploy. In the case with Angular, the actual build of the site was identical each time, it just deployed additional static assets (the MD blog files). 

I still know Angular a lot better than I know 11ty, but I'm looking forward to learning about it more. I think it's clear it suits my purposes better—a simple static blog (although I do miss the Angular docs). 

![11ty](https://camo.githubusercontent.com/f1a9a3921ae3ea9bd2b024d763bdddd8c931be6f/68747470733a2f2f7777772e313174792e696f2f696d672f6c6f676f2d6769746875622e706e67)