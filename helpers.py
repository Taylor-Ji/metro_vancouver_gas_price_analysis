import pandas as pd
import scipy.stats as stats

def get_daily_meian_gas_price(df: pd.DataFrame) -> pd.Series:
    df['scraped_at'] = pd.to_datetime(df['scraped_at'])
    df['weekday'] = df['scraped_at'].dt.day_name()
    # drop only clearly wrong points
    df = df[(df['price_cents'] >= 100) & (df['price_cents'] <= 250)]
    
    weekday_medians = df.groupby('weekday')['price_cents'].median().sort_values()
    print(weekday_medians)
    
    # groups = [df.loc[df['weekday']==d,'price_cents'] for d in df['weekday'].unique()]
    # h, p = stats.kruskal(*groups)
    # print(f"Kruskal–Wallis p = {p:.5f}")
    return weekday_medians

def convert_scraped_at_to_datetime(df: pd.DataFrame) -> pd.DataFrame:
    """Parse the `scraped_at` column as UTC and convert to America/Vancouver timezone.

    Returns a copy of the dataframe with timezone-aware `scraped_at` values.
    """
    out = df.copy()
    # parse as timezone-aware UTC (handles strings and naive datetimes)
    out['scraped_at'] = pd.to_datetime(out['scraped_at'], utc=True)
    # convert to Vancouver timezone (handles DST correctly)
    out['scraped_at'] = out['scraped_at'].dt.tz_convert('America/Vancouver')
    return out

def count_daily_gas_station_entries(df: pd.DataFrame) -> pd.Series:
    """Count number of entries per day in the `scraped_at` column.

    Returns a Series indexed by date (YYYY-MM-DD) with counts.
    """
    out = df.copy()
    out['scraped_at'] = pd.to_datetime(out['scraped_at'], utc=True)
    out['date'] = out['scraped_at'].dt.date
    counts = out.groupby('date').size()
    return counts