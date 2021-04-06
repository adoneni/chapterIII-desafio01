import { GetServerSideProps, GetStaticPaths } from 'next';
import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Head from 'next/head';
import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({post} : PostProps) {
  const router = useRouter();
  if (router.isFallback) {
    return (
      <>
        <Header />
        <div className={styles.loading}>Carregando...</div>
      </>
    )
  }

  const humanWordsPerMinute = 200;
  const titleWords = post.data.title.split(' ').length;

  const totalWords = post.data.content.reduce((acc, content) => {
    const headingWords = content.heading
      ? content.heading.split(' ').length
      : 0;
    const bodyWords = RichText.asText(content.body).split(' ').length;

    acc += headingWords + bodyWords;
    return acc;
  }, 0);

  const timeToRead = Math.ceil((titleWords + totalWords) / humanWordsPerMinute);

  return(
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>
      <Header />
      <div className={styles.imagePost}>
        <img src={post.data.banner.url} alt="imagem" />
      </div>
      <main>
          <article className={styles.post}>
              <h1>{post.data.title}</h1>
              <div className={styles.infoHeader}>
                <span>
                  <FiCalendar />
                  {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                    locale: ptBR,
                  })}
                </span>

                <span>
                  <FiUser />
                  {post.data.author}
                </span>

                <span>
                  <FiUser />
                  {timeToRead} min
                </span>
              </div>
              {post.data.content.map(postData => (
                <div key={postData.heading} className={styles.postSection}>
                  <h1>{postData.heading}</h1>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(postData.body),
                    }}
                  />
                </div>
              ))}
          </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const { results } = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title'],
    }
  );

  const paths = results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetServerSideProps = async({
  params: {slug},
  previewData,
}) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response) {
    return {
      notFound: true,
    };
  }

  const post = {
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    uid: response.uid,
    data: {
      banner: {
        url: response.data.banner?.url ?? '',
      },
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      content: response.data.content,
    },
  };

  return {
    props: {
      post
    }
  };
};
