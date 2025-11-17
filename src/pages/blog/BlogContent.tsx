import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import postsData from './posts/posts.json'
import './Blog.css'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  author: string
  publishedDate: string
  tags?: string[]
  category?: string
  readTime?: number
  published: boolean
}

const BlogContent = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])

  useEffect(() => {
    // Filter only published posts and sort by date (newest first)
    const publishedPosts = postsData.posts
      .filter(post => post.published)
      .sort((a, b) => 
        new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()
      )
    setPosts(publishedPosts)
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="blog-content">
      <div className="blog-posts-list">
        {posts.length === 0 ? (
          <p className="blog-empty">No blog posts yet. Check back soon!</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="blog-post-card">
              <Link to={`/blog/${post.slug}`} className="blog-post-link">
                <h2 className="blog-post-title">{post.title}</h2>
                <div className="blog-post-meta">
                  <span className="blog-post-date">
                    {formatDate(post.publishedDate)}
                  </span>
                  {post.readTime && (
                    <span className="blog-post-read-time">
                      {post.readTime} min read
                    </span>
                  )}
                  {post.category && (
                    <span className="blog-post-category">
                      {post.category}
                    </span>
                  )}
                </div>
                <p className="blog-post-excerpt">{post.excerpt}</p>
                {post.tags && post.tags.length > 0 && (
                  <div className="blog-post-tags">
                    {post.tags.map(tag => (
                      <span key={tag} className="blog-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </Link>
            </article>
          ))
        )}
      </div>
    </div>
  )
}

export default BlogContent

