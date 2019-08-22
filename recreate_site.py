import os
import urllib.request

ORIG_SITE_ROOT = "http://vgdl.herokuapp.com/"

cwd = os.getcwd()
gd = os.path.join(cwd, "games")
games = os.listdir(gd)
print("games: ", len(games))
gds = [os.path.join(gd, g) for g in games]


def rename_to_html(game_dirs):
    gd_files = []
    for g in game_dirs:
        gdfs = os.listdir(g)
        if "0.html" not in gdfs:
            gd_files.append((g, gdfs))

    print(len(gd_files), "html files to move")
    for gdir, fnames in gd_files:
        if not len(fnames) == 1:
            print(gdir, fnames)
        assert len(fnames) == 1
        fname = fnames[0]
        fpath = os.path.join(gdir, fname)
        newfpath = os.path.join(gdir, fname + ".html")
        os.rename(fpath, newfpath)
        print(fname, "->", newfpath)


def to_backfill(game_dirs):
    latests = []
    for g in game_dirs:
        gdfs = os.listdir(g)
        latest = max(int(f.strip(".html")) for f in gdfs)
        latests.append((g, latest))

    nexts = []
    for g, latest in latests:
        fname = os.path.join(g, str(latest) + ".html")
        with open(fname, "r") as f:
            if "data.next = true" in f.read():
                nexts.append((g, latest + 1))
    return nexts


def backfill_htmls(game_dirs):
    nexts = to_backfill(game_dirs)
    while nexts:
        print(len(nexts), "games require additional downloads")
        for g, nextN in nexts:
            rpath = os.path.relpath(g)
            url = os.path.join(ORIG_SITE_ROOT, rpath, str(nextN))
            newf = os.path.join(g, str(nextN) + ".html")
            print("Download(", url, "->", newf, ")")
            urllib.request.urlretrieve(url, newf)
        nexts = to_backfill(game_dirs)
    print("no additional game backfill required")


rename_to_html(gds)

# download additional games
backfill_htmls(gds)
