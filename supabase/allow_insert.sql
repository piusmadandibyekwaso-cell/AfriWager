-- Allow anonymous users (system) to create markets
create policy "Allow public insert markets" on public.markets for insert with check (true);

-- Allow anonymous users to create outcomes
create policy "Allow public insert outcomes" on public.outcomes for insert with check (true);
