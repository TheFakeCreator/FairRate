import React from 'react'
import { createRoot } from 'react-dom/client'
import RatingModal from './components/RatingModal'
import ErrorBoundary from './components/ErrorBoundary'
import { getRating } from '../lib/storage'
import './styles.css'

function openModal(movieId, title, posterUrl) {
  if (document.getElementById('fairrate-root')) return
  const rootDiv = document.createElement('div')
  rootDiv.id = 'fairrate-root'
  document.body.appendChild(rootDiv)
  
  const handleClose = () => {
    root.unmount()
    rootDiv.remove()
    updateHeroUI(movieId)
    updateListUI(movieId)
  }

  const root = createRoot(rootDiv)
  root.render(
    <ErrorBoundary onClose={handleClose}>
      <RatingModal 
        movieId={movieId} 
        title={title} 
        posterUrl={posterUrl}
        onClose={handleClose} 
      />
    </ErrorBoundary>
  )
}

async function updateHeroUI(movieId) {
  const data = await getRating(movieId)
  const wrapper = document.getElementById('fairrate-hero-wrapper')
  if (!wrapper) return

  const textEl = wrapper.querySelector('.fairrate-hero-text')
  const starEl = wrapper.querySelector('.fairrate-hero-star')

  if (textEl && data && data.overall) {
    textEl.innerHTML = `<span class="sc-a30a09c4-1 leFYws">${Number(data.overall)}</span><span style="color: #ffffffb3">/10</span>`
    if (starEl) {
      starEl.setAttribute('fill', 'currentColor')
      starEl.setAttribute('stroke', 'currentColor')
      starEl.style.color = 'rgb(87, 181, 96)'
    }
  } else if (textEl) {
    textEl.innerHTML = `<span style="font-size: 14px; font-weight: 600; color: #5790df;" class="hover:underline">Rate</span>`
    if (starEl) {
      starEl.setAttribute('fill', 'none')
      starEl.setAttribute('stroke', 'currentColor')
      starEl.style.color = '#5790df'
    }
  }
}

async function updateListUI(movieId) {
  const data = await getRating(movieId)
  // There can be multiple list items for the same movie on a single page
  const wrappers = document.querySelectorAll(`[id="fairrate-list-${movieId}"]`)
  if (!wrappers.length) return

  wrappers.forEach(wrapper => {
    const textEl = wrapper.querySelector('.fairrate-list-text')
    const starEl = wrapper.querySelector('.fairrate-list-star')

    if (textEl && data && data.overall) {
      // Rated state (IMDb blue for list items, or we can use our yellow)
      // Let's use blue with a filled star to match IMDb's default behavior
      textEl.innerHTML = `<span style="color: #5790df;">${Number(data.overall)}</span>`
      if (starEl) {
        starEl.setAttribute('fill', 'currentColor')
        starEl.setAttribute('stroke', 'currentColor')
        starEl.style.color = '#5790df'
      }
    } else if (textEl) {
      // Unrated state
      textEl.innerHTML = `<span style="color: #5790df;">Rate</span>`
      if (starEl) {
        starEl.setAttribute('fill', 'none')
        starEl.setAttribute('stroke', 'currentColor')
        starEl.style.color = '#5790df'
      }
    }
  })
}

function injectHeroTrigger() {
  const heroBtn = document.querySelector('[data-testid="hero-rating-bar__user-rating"]')
  if (!heroBtn || document.getElementById('fairrate-hero-wrapper')) return

  const movieIdMatch = window.location.pathname.match(/\/title\/(tt\d+)/)
  if (!movieIdMatch) return
  const movieId = movieIdMatch[1]

  const h1 = document.querySelector('h1[data-testid="hero__pageTitle"]')
  const title = h1 ? h1.textContent.trim() : document.title.split(' - ')[0]

  let posterUrl = ''
  const metaImg = document.querySelector('meta[property="og:image"]')
  if (metaImg && metaImg.content) {
    posterUrl = metaImg.content
  } else {
    const posterImg = document.querySelector('.ipc-poster img, [data-testid="hero-media__poster"] img')
    posterUrl = posterImg ? (posterImg.getAttribute('src') || '') : ''
  }

  const wrapper = document.createElement('div')
  wrapper.id = 'fairrate-hero-wrapper'
  wrapper.className = 'sc-a3dab77e-0 kQVFoB rating-bar__base-button hover:bg-white/10 transition-colors cursor-pointer'
  
  wrapper.innerHTML = `
    <div class="sc-a3dab77e-1 czAxxU" style="text-transform: uppercase;">FAIR RATING</div>
    <span class="ipc-btn__text"></span>
    <div class="sc-a3dab77e-3 iWYCGH" style="height: 36px; display: flex; align-items: center;">
      <svg class="fairrate-hero-star" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <div class="fairrate-hero-text sc-a30a09c4-2 bRKtAc" style="display: flex; align-items: center; gap: 2px;"></div>
    </div>
  `
  
  wrapper.onclick = () => openModal(movieId, title, posterUrl)

  if (heroBtn.parentNode) {
    heroBtn.parentNode.insertBefore(wrapper, heroBtn.nextSibling)
    heroBtn.style.display = 'none'
  }
  
  updateHeroUI(movieId)
}

function injectListTriggers() {
  const listBtns = document.querySelectorAll('button.ipc-rate-button:not([data-fairrate-processed])')
  
  listBtns.forEach(btn => {
    btn.setAttribute('data-fairrate-processed', 'true')
    
    // 1. Universally find the Movie ID by walking up the DOM tree
    // to find the nearest ancestor that contains a movie link.
    let current = btn.parentElement
    let titleLink = null
    
    while (current && current !== document.body && !titleLink) {
      // Look for any link to a title in this container
      const links = Array.from(current.querySelectorAll('a[href*="/title/tt"]'))
      // Prefer links that look like main title links (not reviews or sub-pages)
      titleLink = links.find(a => {
        const href = a.getAttribute('href')
        // Match exact title links, possibly with query params
        return href && href.match(/\/title\/(tt\d+)\/?(\?.*)?$/)
      }) || links[0] // fallback to any title link if no clean one is found
      
      if (!titleLink) {
        current = current.parentElement
      }
    }

    if (!titleLink) return
    
    const href = titleLink.getAttribute('href') || ''
    const idMatch = href.match(/\/title\/(tt\d+)/)
    const movieId = idMatch ? idMatch[1] : null
    if (!movieId) return
    
    // 2. Universally find the Title
    let title = ''
    
    // Attempt 1: Button's own aria-label (e.g. "Rate The Matrix")
    const aria = btn.getAttribute('aria-label')
    if (aria && aria.toLowerCase().startsWith('rate ')) {
      title = aria.substring(5).trim()
    }
    
    // Attempt 2: Find the poster image on the page
    let posterUrl = ''
    
    // Globally search for an image inside a link to this movie, fallback to current container
    const img = document.querySelector(`a[href*="/title/${movieId}"] img`) || (current && current.querySelector('img.ipc-image, img'))
    
    if (img) {
      if (!title && img.getAttribute('alt')) {
        title = img.getAttribute('alt').trim()
      }
      
      // Sometimes IMDb lazy loads and 'src' is a tiny pixel, but 'srcset' has the real images
      const srcset = img.getAttribute('srcset')
      if (srcset) {
        const urls = srcset.match(/https:\/\/[^ ]+/g)
        if (urls && urls.length > 0) {
          posterUrl = urls[urls.length - 1] // Get the highest resolution one
        }
      }
      
      if (!posterUrl || posterUrl.startsWith('data:image')) {
        posterUrl = img.getAttribute('src') || ''
      }
    }
    
    // Attempt 3: Header or title class text
    if (!title && current) {
      const header = current.querySelector('h3, h4, .ipc-title__text, .ipc-poster-card__title, [data-testid="title"]')
      if (header) {
        title = header.textContent.trim()
      }
    }
    
    // Attempt 4: The text or aria-label of the link itself
    if (!title && titleLink) {
      title = titleLink.getAttribute('aria-label') || titleLink.textContent.trim()
    }
    
    // Cleanup title string
    if (title) {
      title = title.replace(/^\d+\.\s+/, '') // Strip "1. " list prefixes
      title = title.replace(/^Rate\s+/i, '') // Strip lingering "Rate " prefixes
      title = title.replace(/^Watch\s+/i, '') // Strip lingering "Watch " prefixes
      title = title.trim()
    }
    
    // Ensure we actually found a title
    if (!title) title = "Current Movie"

    const wrapper = document.createElement('button')
    wrapper.id = `fairrate-list-${movieId}`
    // Prevent the mutation observer from infinitely targeting our own injected wrapper!
    wrapper.setAttribute('data-fairrate-processed', 'true')
    wrapper.className = btn.className + ' hover:bg-white/10 transition-colors'
    wrapper.style.display = 'flex'
    wrapper.style.alignItems = 'center'
    wrapper.style.justifyContent = 'center'
    wrapper.style.cursor = 'pointer'

    wrapper.innerHTML = `
      <span class="ipc-btn__text flex items-center gap-1">
        <svg class="fairrate-list-star" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 2px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span class="fairrate-list-text" style="font-weight: 600; font-size: 14px;">Rate</span>
      </span>
    `

    wrapper.onclick = (e) => {
      e.preventDefault()
      e.stopPropagation()
      openModal(movieId, title, posterUrl)
    }

    if (btn.parentNode) {
      btn.parentNode.insertBefore(wrapper, btn.nextSibling)
      btn.style.display = 'none'
    }

    updateListUI(movieId)
  })
}

function init() {
  let isThrottled = false
  
  const runInjections = () => {
    injectHeroTrigger()
    injectListTriggers()
  }

  // Run once immediately on load
  try {
    runInjections()
  } catch (e) {
    console.error('FairRate injection error:', e)
  }

  const observer = new MutationObserver(() => {
    if (isThrottled) return
    isThrottled = true
    setTimeout(() => {
      try {
        runInjections()
      } catch (e) {
        console.error('FairRate injection error:', e)
      } finally {
        isThrottled = false
      }
    }, 500) // Throttle to run at most once per 500ms
  })

  observer.observe(document.body, { childList: true, subtree: true })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
