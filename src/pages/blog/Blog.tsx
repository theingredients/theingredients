import Layout from '../../components/Layout'
import BlogContent from './BlogContent'
import '../PageStyles.css'

const Blog = () => {
  return (
    <Layout>
      <div className="page-container">
        <h1 className="page-title">Blog</h1>
        <BlogContent />
      </div>
    </Layout>
  )
}

export default Blog

