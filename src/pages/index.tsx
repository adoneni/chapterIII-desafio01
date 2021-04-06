import { GetStaticProps } from 'next';
import Prismic from '@prismicio/client';
import Head from 'next/head';
import {FiCalendar, FiUser} from 'react-icons/fi';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Link from 'next/link';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({postsPagination: { next_page, results },}: HomeProps) {
  const [posts, postsSet] = useState(results);
  const [nextPage, nextPageSet] = useState(next_page);

  async function loadMorePages(){
    await fetch(next_page)
      .then(response => response.json())
      .then(
        response => {
          {
            postsSet([...posts, ...response.results]);
            nextPageSet(response.next_page);
          }
        }
    )
  }

  return(
    <>
      <Head>
        <title>Home | spacetraveling.</title>
      </Head>
      <Header />
      <main className={styles.container}>
        <div className={styles.posts}>
        { posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <div>
                      <FiCalendar />
                      <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', {locale: ptBR})}</time>
                      <FiUser />
                      <span>{post.data.author}</span>
                    </div>
                  </a>
              </Link>
          ))}
          {nextPage &&
            <button
              className={styles.loadMoreButton}
              onClick={loadMorePages}
            >
              Carregar mais posts
            </button>
          }
         </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([Prismic.predicates.at('document.type', 'posts')],
        {pageSize: 1});

  const results = postsResponse.results.map(post => {
    return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
    }
  })

 return {
    props: {
      postsPagination: { results, next_page: postsResponse.next_page },
    },
  };
};
