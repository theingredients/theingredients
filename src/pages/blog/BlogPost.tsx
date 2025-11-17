import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import { sanitizeHtmlContent } from '../../utils/inputSanitizer'
import postsData from './posts/posts.json'
import '../PageStyles.css'
import './Blog.css'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  author: string
  publishedDate: string
  updatedDate?: string
  tags?: string[]
  category?: string
  readTime?: number
  published: boolean
}

const BlogPostView = () => {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    const foundPost = postsData.posts.find(p => p.slug === slug && p.published)
    if (foundPost) {
      setPost(foundPost)
    } else {
      setNotFound(true)
    }
  }, [slug])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }


  if (notFound) {
    return (
      <Layout>
        <div className="page-container">
          <h1 className="page-title">Post Not Found</h1>
          <p className="blog-not-found">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="blog-back-link">← Back to Blog</Link>
        </div>
      </Layout>
    )
  }

  if (!post) {
    return (
      <Layout>
        <div className="page-container">
          <p>Loading...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="page-container">
        <Link to="/blog" className="blog-back-link">← Back to Blog</Link>
        <article className="blog-post">
          <header className="blog-post-header">
            <h1 className="blog-post-title-full">{post.title}</h1>
            <div className="blog-post-meta-full">
              <span className="blog-post-author">By {post.author}</span>
              <span className="blog-post-date-full">
                {formatDate(post.publishedDate)}
              </span>
              {post.updatedDate && post.updatedDate !== post.publishedDate && (
                <span className="blog-post-updated">
                  Updated: {formatDate(post.updatedDate)}
                </span>
              )}
              {post.readTime && (
                <span className="blog-post-read-time-full">
                  {post.readTime} min read
                </span>
              )}
              {post.category && (
                <span className="blog-post-category-full">
                  {post.category}
                </span>
              )}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div className="blog-post-tags-full">
                {post.tags.map(tag => (
                  <span key={tag} className="blog-tag">{tag}</span>
                ))}
              </div>
            )}
          </header>
          <div 
            className="blog-post-content"
            dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(post.content) }}
          />
        </article>
      </div>
    </Layout>
  )
}

export default BlogPostView

