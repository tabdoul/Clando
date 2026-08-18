package com.example.wayvo.service;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class DjomyService {

    private static final Logger log = LoggerFactory.getLogger(DjomyService.class);

    @Value("${djomy.client.id}")
    private String clientId;

    @Value("${djomy.client.secret}")
    private String clientSecret;

    @Value("${djomy.base.url}")
    private String baseUrl;
    public String getClientSecret() {
    return clientSecret;
}

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateHmac(String data, String secret) throws Exception {
        Mac sha256Hmac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(
            secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256Hmac.init(secretKey);
        byte[] hashBytes = sha256Hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    public String generateApiKey() throws Exception {
        String signature = generateHmac(clientId, clientSecret);
        return clientId + ":" + signature;
    }

    public String getAccessToken() throws Exception {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", generateApiKey());

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(new HashMap<>(), headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                baseUrl + "/v1/auth",
                HttpMethod.POST,
                request,
                Map.class
            );
            Map<String, Object> body = response.getBody();
            if (body != null && body.containsKey("data")) {
                Map<String, Object> data = (Map<String, Object>) body.get("data");
                if (data != null && data.containsKey("accessToken")) {
                    return (String) data.get("accessToken");
                }
            }
            throw new RuntimeException("Impossible d'obtenir le token Djomy");
        } catch (Exception e) {
            log.error("Erreur auth Djomy: {}", e.getMessage());
            throw e;
        }
    }

    public Map<String, Object> initierPaiement(
            String numeroTelephone,
            double montant,
            String reference,
            String description) throws Exception {

        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", generateApiKey());
        headers.setBearerAuth(token);

        Map<String, Object> body = new HashMap<>();
        body.put("paymentMethod", "OM");
        body.put("payerIdentifier", numeroTelephone);
        body.put("amount", montant);
        body.put("countryCode", "GN");
        body.put("description", description);
        body.put("merchantPaymentReference", reference);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            baseUrl + "/v1/payments",
            HttpMethod.POST,
            request,
            Map.class
        );

        return response.getBody();
    }

    public Map<String, Object> initierPaiementOM(
        String numeroTelephone,
        double montant,
        String reference,
        String description) throws Exception {

    String token = getAccessToken();

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("X-API-KEY", generateApiKey());
    headers.setBearerAuth(token);

    Map<String, Object> body = new HashMap<>();
    body.put("paymentMethod", "OM");
    body.put("payerIdentifier", numeroTelephone);
    body.put("amount", montant);
    body.put("countryCode", "GN");
    body.put("description", description);
    body.put("merchantPaymentReference", reference);

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

    log.debug("Initier paiement OM direct: {}", body);

    ResponseEntity<Map> response = restTemplate.exchange(
        baseUrl + "/v1/payments",
        HttpMethod.POST,
        request,
        Map.class
    );

    log.debug("Reponse OM: {}", response.getBody());
    return response.getBody();
}

    public Map<String, Object> initierPayout(
        String numeroTelephone,
        String nomBeneficiaire,
        double montant,
        String reference,
        String description,
        boolean dryRun) throws Exception {

    String token = getAccessToken();

    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_JSON);
    headers.set("X-API-KEY", generateApiKey());
    headers.setBearerAuth(token);

    // ⚠️ Schema ajuste suite aux erreurs de validation successives —
    // compte/type/countryCode dans destination, nom ajoute dans beneficiary
    // Toujours pas confirme officiellement — a valider avec dryRun avant de repasser en reel
    Map<String, Object> beneficiary = new HashMap<>();
    beneficiary.put("identifier", numeroTelephone);
    beneficiary.put("name", nomBeneficiaire);

    Map<String, Object> account = new HashMap<>();
    account.put("accountNumber", numeroTelephone);
    account.put("providerCode", "OM");

    Map<String, Object> destination = new HashMap<>();
    destination.put("account", account);
    destination.put("type", "WALLET");
    destination.put("countryCode", "GN");

    Map<String, Object> item = new HashMap<>();
    item.put("paymentMethod", "OM");
    item.put("beneficiary", beneficiary);
    item.put("destination", destination);
    item.put("amount", montant);
    item.put("countryCode", "GN");
    item.put("reference", reference);

    Map<String, Object> body = new HashMap<>();
    body.put("description", description);
    body.put("items", java.util.List.of(item));

    String url = baseUrl + "/v1/payout-orders" + (dryRun ? "?dryRun=true" : "");

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

    log.debug("Initier payout conducteur (dryRun={}): {}", dryRun, body);

    ResponseEntity<Map> response = restTemplate.exchange(
        url,
        HttpMethod.POST,
        request,
        Map.class
    );

    log.info("Reponse payout: {}", response.getBody());
    return response.getBody();
}

    public boolean verifierSignatureWebhook(String payload, String signatureRecue) throws Exception {
        // Format attendu : "v1:signature"
        if (signatureRecue == null || !signatureRecue.startsWith("v1:")) {
            return false;
        }
        String signatureAttendue = generateHmac(payload, clientSecret);
        String signatureExtraite = signatureRecue.substring(3);
        return signatureAttendue.equals(signatureExtraite);
    }

    public Map<String, Object> verifierStatutPaiement(String transactionId) throws Exception {
        String token = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-API-KEY", generateApiKey());
        headers.setBearerAuth(token);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<Map> response = restTemplate.exchange(
            baseUrl + "/v1/payments/" + transactionId + "/status",
            HttpMethod.GET,
            request,
            Map.class
        );

        return response.getBody();
    }
}