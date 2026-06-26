package com.example.Clando.service;

import org.springframework.stereotype.Service;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class ItineraireService {

private static final Map<String, List<String>> QUARTIERS_PAR_ITINERAIRE = Map.of(
    "Autoroute", Arrays.asList(
        "km 36", "kountia", "lansanayah barrage", "dabompa", "tombolia",
        "enta", "kissosso", "sangoyah", "matoto", "yimbayah",
        "aeroport", "gbessia", "dabondy", "bonfi", "matam",
        "kenien", "madina", "donka", "cameroun", "pont 8 novembre", "kaloum", "en ville", "centre ville"
    ),
    "Route du Prince", Arrays.asList(
        "cimenterie", "t8", "sonfonia", "t7", "t6", "t5",
        "wanindara", "enco5", "cosa", "bambeto", "hamdallaye",
        "miniere", "dixinn", "pont 8 novembre", "kaloum", "en ville", "centre ville"
    ),
    "Corniche", Arrays.asList(
        "sonfonia", "yattaya", "kobayah", "lambanyi", "nongo",
        "kaporo", "kipe", "ratoma", "taouyah", "pont 8 novembre", "kaloum", "en ville", "centre ville"
    )
);
    private String normaliser(String str) {
        if (str == null) return "";
        return str.toLowerCase()
            .replace("é", "e").replace("è", "e").replace("ê", "e")
            .replace("à", "a").replace("â", "a").replace("ô", "o")
            .replace("î", "i").replace("ù", "u").trim();
    }

    private int trouverIndex(List<String> quartiers, String recherche) {
        String rechercheNorm = normaliser(recherche);
        for (int i = 0; i < quartiers.size(); i++) {
            String q = quartiers.get(i);
            if (q.equals(rechercheNorm) ||
                q.contains(rechercheNorm) && rechercheNorm.length() >= 4 ||
                rechercheNorm.contains(q) && q.length() >= 4) {
                return i;
            }
        }
        return -1;
    }

    public boolean trajetCorrespond(String itineraire,
                                String departTrajet, String arriveeTrajet,
                                String departRecherche, String arriveeRecherche) {
    if (itineraire == null) return false;

    List<String> quartiers = null;
    for (Map.Entry<String, List<String>> entry : QUARTIERS_PAR_ITINERAIRE.entrySet()) {
        if (normaliser(entry.getKey()).contains(normaliser(itineraire)) ||
            normaliser(itineraire).contains(normaliser(entry.getKey()))) {
            quartiers = entry.getValue();
            break;
        }
    }

    if (quartiers == null) return false;

    int indexDepartTrajet    = trouverIndex(quartiers, departTrajet);
    int indexArriveeTrajet   = trouverIndex(quartiers, arriveeTrajet);
    int indexDepartRecherche = trouverIndex(quartiers, departRecherche);
    int indexArriveeRecherche = trouverIndex(quartiers, arriveeRecherche);

    if (indexDepartTrajet == -1 || indexArriveeTrajet == -1 ||
        indexDepartRecherche == -1 || indexArriveeRecherche == -1) {
        return false;
    }

    //  Sens ALLER : périphérie → centre (km36 → kaloum)
    if (indexDepartTrajet < indexArriveeTrajet) {
        return indexDepartTrajet <= indexDepartRecherche &&
               indexArriveeTrajet >= indexArriveeRecherche &&
               indexDepartRecherche < indexArriveeRecherche;
    }

    //  Sens RETOUR : centre → périphérie (kaloum → km36)
    if (indexDepartTrajet > indexArriveeTrajet) {
        return indexDepartTrajet >= indexDepartRecherche &&
               indexArriveeTrajet <= indexArriveeRecherche &&
               indexDepartRecherche > indexArriveeRecherche;
    }

    return false;
}

    public List<String> getQuartiers(String itineraire) {
        for (Map.Entry<String, List<String>> entry : QUARTIERS_PAR_ITINERAIRE.entrySet()) {
            if (normaliser(entry.getKey()).contains(normaliser(itineraire)) ||
                normaliser(itineraire).contains(normaliser(entry.getKey()))) {
                return entry.getValue();
            }
        }
        return List.of();
    }
}