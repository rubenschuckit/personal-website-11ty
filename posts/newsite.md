---
title: My Site 2.0
date: 2020-04-09T00:00:00.000Z
summary: Rewriting from Angular to 11ty.
tags:
  - tech
---
# Motivation

Everyone seems to be brushing off their side projects during this pandemic, so I thought I would too.

Towards the middle of last year, I began working on my personal website and decided to build it in Angular. I used Angular at work and am a big fan. But at the end of the day, it felt a little heavy for what I needed. 

What I really need is a framework that can pre-render my pages (read: a static site generator). There's a lot of exciting work going on with Angular pre-rendering (not just SSR), but it's in its early stages. Especially since I want to include a blog with minimal effort, it makes sense for me to store the MD files in my Git repo and have them translated to HTML **before** it's served to you.

I didn't want to set up an external DB or headless CMS. And I was able to accomplish this in Angular, but whenever you would load a blog post, it would grab the static MD file and then translate it to HTML in your browser. It's fast and probably not even that much slower than what I have now. But it was kind of wasteful to have that translation occur *every* time when that content literally never changes and could be done once. So...I decided to switch to 11ty. 

11ty is far more suited to what I need (although I do miss the SPA factor). And the site actually looks exactly the same! There was some unrolling to do since I no longer get things like components with content projection, but this personal site doesn't need to worry too much about scale. It also gave me an excuse to switch to Netlify, which has killer features like deployment previews with PRs. And I can add blog posts, build, and then easily redeploy. In the case with Angular, the actual build of the site was identical each time, it just deployed additional static assets (the MD blog files). 

# Results

## Deployments

I think the results are pretty good. The rewrite took me a few days working on and off in my free time. I already like a few things better.

First, Netlify makes it so simple to test and deploy the site. One of the cool things I did with my previous site was setup a CI/CD pipeline using GitHub Actions. To be fair, such formalities really aren't required for Angular apps. They do have scaffolding to easily deploy your site via the CLI to things like Firebase, but it was fun to setup something resembling enterprise (automated tests included). 

But that's not really necessary. And the deployment previews are such a killer feature! 

## Blog

The most dynamic aspect of the site are the blog posts. It's really just for my sake- a personal digital archive of sorts. Static site generators have this functionality front and center where React and Angular are more-suited for much larger and functional applications (but there are offshoots for the previously mentioned that try to help like Gatsby and NextJS for React and [Scully](https://github.com/scullyio/scully) for Angular). 

## Netlify CMS

Which brings me to my last point. Another bit of Netlify praise. Netlify offers an awesome tool called [Netlify CMS](https://www.netlifycms.org/). A much larger website might use a Headless CMS that sends contents across the network separate from the initial markup. I don't want to set up an additional server, so with Netlify CMS I can use an awesome GUI to write a post and have it (somewhat magically) end up committed in my Git repository in the right directory as MD so that 11ty can do the rest on build.

When I wrote the Angular site, there was a lot of TS/JS that had to be written. With 11ty, not so much. But I did want my blog posts to be grouped by year, and I could accomplish this with a custom collection that nests the posts by their year at the top level of a JS object. It's a hacky group by, but gets the job done. 

```js
 eleventyConfig.addCollection('blogPosts', collection => {
    const posts = collection.getFilteredByTag('post');
    const postsByYear = [];
    posts.forEach(post => {
      const currentIndex = postsByYear.length - 1;
      const year = DateTime.fromJSDate(post.date).year;
      if (currentIndex === -1 || postsByYear[currentIndex].year !== year) {
        postsByYear.push({ year, posts: [post] });
      } else {
        postsByYear[currentIndex].posts.push(post);
      }
    });
    return postsByYear;
  });
```

![11ty]()