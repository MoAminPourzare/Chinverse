import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import PublicMediaImage from './PublicMediaImage';

vi.mock('next/image', () => ({
    default: ({ src, alt, onError, "data-theme-asset": theme }: { src: string; alt: string; onError: () => void; "data-theme-asset"?: string }) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} data-theme-asset={theme} onError={onError} />
    ),
}));
afterEach(cleanup);

it('replaces a missing original with a local placeholder and loads a newly uploaded source', () => {
    const onError = vi.fn();
    const { rerender } = render(<PublicMediaImage src='/uploads/missing.jpg' alt='دوره' width={100} height={100} onError={onError} />);
    fireEvent.error(screen.getByRole('img', { name: 'دوره' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/chinverse/image-unavailable.svg');
    expect(onError).toHaveBeenCalledTimes(1);
    rerender(<PublicMediaImage src='/uploads/new.jpg' alt='دوره' width={100} height={100} />);
    expect(screen.getByRole('img')).toHaveAttribute('src', '/uploads/new.jpg');
});

it('uses the avatar placeholder when supplied', () => {
    render(<PublicMediaImage src='/uploads/missing-avatar.jpg' fallbackSrc='/assets/chinverse/icons/profile.svg' alt='تارا' width={44} height={44} />);
    fireEvent.error(screen.getByRole('img'));
    expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', '/assets/chinverse/icons/profile.svg');
    expect(screen.getAllByRole('img')[1]).toHaveAttribute('src', '/assets/chinverse/dark/icons/profile.svg');
});
