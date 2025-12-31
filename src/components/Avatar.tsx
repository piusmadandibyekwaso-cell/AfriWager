import React from 'react';
import Avatar from 'boring-avatars';

interface CustomAvatarProps {
    name: string;
    size?: number;
    className?: string;
    variant?: 'beam' | 'bauhaus' | 'ring' | 'sunset' | 'pixel' | 'marble';
}

const BRAND_COLORS = [
    '#000000', // Black
    '#10B981', // Emerald 500
    '#34D399', // Emerald 400
    '#F59E0B', // Amber 500
    '#EF4444', // Red 500
];

export default function UserAvatar({ name, size = 40, className, variant = 'beam' }: CustomAvatarProps) {
    return (
        <div className={`overflow-hidden rounded-full ${className}`} style={{ width: size, height: size }}>
            <Avatar
                size={size}
                name={name}
                variant={variant}
                colors={BRAND_COLORS}
            />
        </div>
    );
}
