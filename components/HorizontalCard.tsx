import { Link } from 'expo-router';
import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface HorizontalCardProps {
  id: number;
  title: string;
  poster_path: string | null;
  type: 'movie' | 'show';
  year?: string;
}

const HorizontalCard = ({ id, title, poster_path, type, year }: HorizontalCardProps) => {
  const href = type === 'movie' ? `/movies/${id}` : `/shows/${id}`;

  return (
    <Link href={href as any} asChild>
      <TouchableOpacity className="w-36">
        <Image
          source={{
            uri: poster_path
              ? `https://image.tmdb.org/t/p/w500${poster_path}`
              : `https://placehold.co/144x208/1a1a1a/ffffff.png`,
          }}
          className="w-36 h-52 rounded-lg"
          resizeMode="cover"
        />
        <Text className="text-sm font-bold text-white mt-2" numberOfLines={2}>
          {title}
        </Text>
        {year && (
          <Text className="text-xs text-gray-500 mt-0.5">{year}</Text>
        )}
      </TouchableOpacity>
    </Link>
  );
};

export default HorizontalCard;
