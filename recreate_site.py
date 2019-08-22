import os
cwd = os.getcwd()
gd = os.path.join(cwd, 'games')
games = os.listdir(gd)
print('games: ', len(games))
gds = [os.path.join(gd, g) for g in games]

def rename_to_html(game_dirs):
    gd_files = []
    for g in game_dirs:
        gdfs = os.listdir(g)
        if '0.html' not in gdfs:
            gd_files.append((g, gdfs))

    print(len(gd_files), 'html files to move')
    for gdir, fnames in gd_files:
        if not len(fnames) == 1:
            print(gdir, fnames)
        assert len(fnames) == 1
        fname = fnames[0]
        fpath = os.path.join(gdir, fname)
        newfpath = os.path.join(gdir, fname + '.html')
        os.rename(fpath, newfpath)
        print(fname, '->', newfpath)

rename_to_html(gds)

# fix paths
# download additional games
