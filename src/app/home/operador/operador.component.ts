import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AdminService } from '../../service/admin/admin.service';
import { DadosSenha } from '../../interface/dadossenha';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { BsModalRef, BsModalService, } from 'ngx-bootstrap/modal'
import { Router } from '@angular/router';
import { get, getDatabase, ref, set, update } from 'firebase/database';
import { Database } from '@angular/fire/database';
import { AuthService } from '../../service/auth/auth.service';


// Importar o Modal do Bootstrap
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//finalizado

@Component({
  selector: 'app-operador',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgxSpinnerModule, FormsModule,],
  templateUrl: './operador.component.html',
  styleUrl: './operador.component.scss',
  providers:[BsModalRef, BsModalService]
})
export class OperadorComponent implements OnInit, OnDestroy {
  operador: string ='';
  guiche: string = '';
  setor: string ='';
  senhaOperadorPainel: DadosSenha = new DadosSenha;
  senhaPreferencial: DadosSenha []= [];
  senhaNormal: DadosSenha = new DadosSenha;
  senhaNormalNova: DadosSenha[] = [];
  senhaPainel: DadosSenha[] =[];
  repetirSenha: DadosSenha []= [];
  senhaFinalizar: DadosSenha = new DadosSenha;
  telaoperador:boolean = false;
  telalogin:boolean = true;
  mostrarSenhas: boolean = false; // Controla a exibição das senhas não atendidas
 
  private keyPressHandler!: (event: KeyboardEvent) => void;
  private setorUsuarioDefinido = false;
  setorUsuario: string = '';
  

  private nomeUsuarioDefinido = false;
  nomeUsuario: string = '';
  nomeSelecionado: string = '';
  
  //propriedade para controle de avaliação
  exibirSelecaoNota: boolean = false;
  //notasDisponiveis: number[] = Array.from({ length: 11 }, (_, i) => i); // 0 a 10
  //notaSelecionada: number | null = null;
  
  notaFinalizada: number | null = null; 
  // Captura de nota via teclado
  notaDigitada: string | null = null;
 //SETORES
 setoresDisponiveis: string[] = []; // Exemplo de setores
 setorSelecionado: string = '';
 senhasFiltradas: DadosSenha[] = []; // Senhas filtradas pelo setor


  // Array para armazenar as senhas geradas
  senhasPreferenciais: DadosSenha[] = [];
  senhasNaoPreferenciais: DadosSenha[] = [];
  
  //VARIÁVEL QUE CRIA FORMULARIO

   formulario!: FormGroup;

   senha: DadosSenha [] = [];
   senhaVerificar: DadosSenha[] =[];

   modalRef?: BsModalRef;
   @ViewChild('modalTemplate') modalTemplate!: TemplateRef<any>;
  constructor(
    private adminService: AdminService,
    private formBuilder: FormBuilder,
    private spinner: NgxSpinnerService,
    private modalService: BsModalService,
    private router: Router,
    private db: Database,
     private authService: AuthService
  ) {}


  ngOnInit(): void {
    // Verifica se o usuário está autenticado ao carregar o componente
  if (!this.authService.isUserAuthenticated()) {
    this.router.navigate(['/login']);  // Redireciona para o login se não estiver autenticado
  } else {
    this.formbuilder()
     // Carrega os setores disponíveis
  this.carregarSetores();}
  
  this.verificarSetorUsuario();

  this.mostrarSenhasNaoAtendidas();

  this.verificarNomeUsuario();
  //this.formulario.get('setor')?.setValue(this.setorUsuario);
  
    // Obtém as senhas geradas do serviço AdminService
    /*this.adminService.getSenhasGeradas().subscribe(d => {
      console.log(d.length);
      this.senha = d;
     
       // Filtra senhas do operador atual
      this.senhaVerificar = this.senha.filter(s => s.operador === this.operador);
        
     
    });*/
    //document.addEventListener('keydown', this.onKeyPress.bind(this));
    
    
     // Obtém senhas convencionais e organiza em preferencial e normal
    this.adminService.getSenhaGeradaConvencional().subscribe(d =>{
      console.log(d.length);
      this.repetirSenha = d;
      this.filtrarSenhasPorSetor();
      this.senhaNormalNova = [];
      this.senhaPreferencial = [];
        for (let index = 0; index < d.length; index++) {
        
          if (d[index].preferencial == true && d[index].status == '0'){
            this.senhaPreferencial.push(d[index]);
           
          }else if(d[index].status == '0') {
            this.senhaNormalNova.push(d[index]);
           
          }
        
        }
        console.log(this.senhaNormalNova);
        console.log(this.senhaPreferencial);
    })

    // Obtém senhas do painel convencional
    this.adminService.getSenhaPainelConvencional().subscribe(async d =>{
       this.senhaPainel = d
    })
  
    
    this.keyPressHandler = this.onKeyPress.bind(this);
  }
  ngOnDestroy() {
    document.removeEventListener('keydown', this.keyPressHandler);
  }

  // Verifica se o usuário logado pertence ao setor selecionado
    async verificarSetorUsuario() {
      // Criamos um identificador único para cada aba
      const abaId = this.gerarIdentificadorAba();
    
      // Verifica se já há um setor salvo para esta aba
      const setorSalvo = localStorage.getItem(`setorUsuario_${abaId}`);
      if (setorSalvo) {
        this.setorUsuario = setorSalvo;
        this.setorUsuarioDefinido = true;
        console.log(`Setor carregado para a aba ${abaId}:`, this.setorUsuario);
        //this.carregarSenhasDoSetor();
        return;
      }
    
      // Se ainda não foi definido, busca do banco
      this.authService.getUser().subscribe(async user => {
        if (user && !this.setorUsuarioDefinido) {
          const userRef = ref(this.db, `usuarios/${user.uid}`);
          const snapshot = await get(userRef);
    
          if (snapshot.exists()) {
            this.setorUsuario = snapshot.val().setor.trim().toLowerCase();
    
            // Salva no localStorage com o ID da aba
            localStorage.setItem(`setorUsuario_${abaId}`, this.setorUsuario);
            this.setorUsuarioDefinido = true;
            
            console.log(`Setor do usuário logado (Aba ${abaId}):`, this.setorUsuario);
    
            // Se o setor selecionado for diferente, corrige
            if (this.setorSelecionado.trim().toLowerCase() !== this.setorUsuario) {
              alert(`Setor: ${this.setorUsuario}`);
              this.setorSelecionado == this.setorUsuario;
            }
            this.formulario.get('setor')?.setValue(this.setorUsuario);
           // this.carregarSenhasDoSetor();
          }
        }
      });
    }

    async verificarNomeUsuario() {
      // Criamos um identificador único para cada aba
      const abaId = this.gerarIdentificadorAba();
    
      // Verifica se já há um nome salvo para esta aba
      const nomeSalvo = localStorage.getItem(`nomeUsuario_${abaId}`);
      if (nomeSalvo) {
        this.nomeUsuario = nomeSalvo;
        this.nomeUsuarioDefinido = true;
        console.log(`Nome carregado para a aba ${abaId}:`, this.nomeUsuario);
        return;
      }
    
      // Se ainda não foi definido, busca do banco
      this.authService.getUser().subscribe(async user => {
        if (user && !this.nomeUsuarioDefinido) {
          const userRef = ref(this.db, `usuarios/${user.uid}`);
          const snapshot = await get(userRef);
    
          if (snapshot.exists()) {
            this.nomeUsuario = snapshot.val().nome.trim(); // Aqui estamos assumindo que o campo se chama 'nome'
            
            // Salva no localStorage com o ID da aba
            localStorage.setItem(`nomeUsuario_${abaId}`, this.nomeUsuario);
            this.nomeUsuarioDefinido = true;
            
            console.log(`Nome do usuário logado (Aba ${abaId}):`, this.nomeUsuario);
    
            // Se o nome selecionado for diferente, corrige
            if (this.nomeSelecionado.trim().toLowerCase() !== this.nomeUsuario.toLowerCase()) {
              alert(`Nome: ${this.nomeUsuario}`);
              this.nomeSelecionado = this.nomeUsuario;
            }
    
            // Preenche o campo 'nome' do formulário
            this.formulario.get('nome')?.setValue(this.nomeUsuario);
          }
        }
      });
    }
    
     
    
 // Gera um identificador único para cada aba
private gerarIdentificadorAba(): string {
  // Sempre gera um novo ID quando a aba é recarregada
  const abaId = Math.random().toString(36).substring(2, 15); // Gera um ID aleatório
  sessionStorage.setItem('abaId', abaId); // Salva o novo ID no sessionStorage
  return abaId;
}

  // Criação do formulário de login do operador
  formbuilder(){
    this.formulario = this.formBuilder.group({
      setor: ['', Validators.required],
      guiche: ['',[Validators.required, Validators.minLength(5)]],
      nome: ['',[Validators.required, Validators.minLength(6)]],
    })      
  }

  // Filtra as senhas com base no setor selecionado
filtrarSenhasPorSetor() {
  if (!this.setorUsuarioDefinido) {
    console.warn('Nenhum setor selecionado.');
    return;
  }

  // Filtra as senhas geradas convencionalmente pelo setor
  this.senhaNormalNova = this.repetirSenha.filter(
    (senha) => senha.setor === this.setorUsuario && senha.status === '0' && !senha.preferencial
  );

  this.senhaPreferencial = this.repetirSenha.filter(
    (senha) => senha.setor === this.setorUsuario && senha.status === '0' && senha.preferencial
  );

  console.log('Senhas normais no setor:', this.senhaNormalNova);
  console.log('Senhas preferenciais no setor:', this.senhaPreferencial);
}
  // Função para gerar uma nova senha
  novasenha() {}
  
   // Repete a chamada de uma senha no painel
  async repetirsenha(senha:DadosSenha) {
    // console.log(senha);
    this.spinner.show();
     for (let index = 0; index < this.senhaPainel.length; index++) {
       if( senha.senhaid === this.senhaPainel[index].senhaid ){
         this.senhaPainel[index].status = '1'
       await  this.adminService.updateSenhaChamada(this.senhaPainel[index].horachamada, this.senhaPainel[index]).then(async d => {
           console.log(d);
           await delay(2000);
           this.spinner.hide();
         })
       } 
     }
      this.spinner.hide();
    
         
   }

 // Repete a chamada de uma senha convencional  
 async repetirSenhaConvencional(senha: DadosSenha) {
  this.spinner.show();
  console.log("Repetindo senha:", senha);

  // Remove a senha chamada anteriormente do painel
  this.senhaPainel = this.senhaPainel.filter(s => s.senhaid !== senha.senhaid);

  try {
    if (senha.preferencial) {
      console.log("Repetindo senha preferencial...");
      await this.chamarsenhapreferencial(senha);
    } else {
      console.log("Repetindo senha normal...");
      await this.chamarSenhaNormalConvencional(senha);
    }
  } catch (error) {
    console.error("Erro ao repetir senha:", error);
  } finally {
    this.spinner.hide();
  }
}

   // Chama uma senha normal no painel
  async chamarsenhanormal(senha:DadosSenha) {
    this.spinner.show();
    let time = Date.now().toString();
    console.log(senha);
    console.log(senha.operador);
    senha.status ='1';
    senha.horachamada = time;
    console.log(senha);
    await this.adminService.salvaSenhaChamada(senha)
    await this.adminService.updateSenha(senha.senhaid, senha).then( d=> {
       this.spinner.hide();
       this.filtrarSenhasPorSetor(); // Atualiza a lista após chamada
    })
     // Registra o momento da chamada da senha
  this.senhaOperadorPainel = senha;  // Armazena a senha chamada
  }
  
  // Método para buscar as senhas do setor sem chamar automaticamente
buscarSenhasDoSetor(): Promise<DadosSenha[]> {
  return new Promise((resolve, reject) => {
      this.adminService.getSenhasGeradas().subscribe(
          (senhas) => {
              console.log('Senhas recebidas para chamada:', senhas);
              if (!senhas || senhas.length === 0) {
                  console.warn('Nenhuma senha disponível para chamada.');
                  resolve([]);
                  return;
              }

              // Elimina duplicatas baseado no campo 'senha'
              const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
                  .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);

              // Normaliza os setores
              const setorUsuarioNormalizado = this.setorUsuario.trim().toLowerCase();

              // Filtra as senhas do setor do usuário
              const senhasDoSetor = senhasUnicas.filter(s => s.setor.trim().toLowerCase() === setorUsuarioNormalizado);
              console.log('Senhas do setor para chamada:', senhasDoSetor);

              resolve(senhasDoSetor);
          },
          (error) => {
              console.error('Erro ao buscar senhas para chamada:', error);
              reject(error);
          }
      );
  });
}

// Método que só chama a senha quando o botão for clicado
async chamarSenhaNormalConvencional(senhaSelecionada?: DadosSenha, repeticao: boolean = false) {
  this.spinner.show();
  const time = Date.now().toString();

  try {
    const senha = senhaSelecionada || (await this.buscarSenhasDoSetor()).find((s) => !s.preferencial);

    if (!senha) {
      console.warn('Nenhuma senha normal disponível para chamada.');
      this.spinner.hide();
      return;
    }

    senha.operador = this.operador;
    senha.guiche = this.guiche;
    senha.status = '1';
    senha.horachamada = time;
    this.senhaOperadorPainel = senha;

    const senhageradaPath = `avelar/senhagerada/${senha.senhaid}`;

    await this.adminService.salvaSenhaConvencionalChamadaRealTime(senha);
    await this.adminService.updateSenhaRealtimeConvencional(senha.senhaid, senha);

    // Se não for repetição, remove do banco
    if (!repeticao) {
      await update(ref(this.db), { [senhageradaPath]: null });
    }

    console.log("Senha chamada:", senha);
  } catch (error) {
    console.error("Erro ao chamar senha normal:", error);
  } finally {
    this.spinner.hide();
    this.filtrarSenhasPorSetor();
  }
}

 
  // Chama uma senha preferencial convencional
  async chamarsenhapreferencial(senhaSelecionada?: DadosSenha, repeticao: boolean = false) {
    this.spinner.show();
    const time = Date.now().toString();
  
    try {
      const senha = senhaSelecionada || (await this.buscarSenhasDoSetor()).find((s) => s.preferencial);
  
      if (!senha) {
        console.warn('Nenhuma senha preferencial disponível para chamada.');
        this.spinner.hide();
        return;
      }
  
      senha.operador = this.operador;
      senha.guiche = this.guiche;
      senha.status = '1';
      senha.horachamada = time;
      this.senhaOperadorPainel = senha;
  
      const senhageradaPath = `avelar/senhagerada/${senha.senhaid}`;
  
      await this.adminService.salvaSenhaConvencionalChamadaRealTime(senha);
      await this.adminService.updateSenhaRealtimeConvencional(senha.senhaid, senha);
  
      // Se não for repetição, remove do banco
      if (!repeticao) {
        await update(ref(this.db), { [senhageradaPath]: null });
      }
  
      console.log("Senha chamada:", senha);
    } catch (error) {
      console.error("Erro ao chamar senha preferencial:", error);
    } finally {
      this.spinner.hide();
      this.filtrarSenhasPorSetor();
    }
  }
// Carrega os setores do Firebase
async carregarSetores() {
  const setoresRef = ref(this.db, `avelar/setor`);
  const snapshot = await get(setoresRef);

  if (snapshot.exists()) {
    const setoresData = snapshot.val() as Record<string, { setor: string }>;
    this.setoresDisponiveis = Object.values(setoresData).map((item) => item.setor);
    console.log('Setores carregados:', this.setoresDisponiveis);
  } else {
    console.log('Nenhum setor encontrado no banco de dados.');
  }
}
  // Registra operador no sistema
  /*cadastrar(){
    console.log(this.formulario.value);
    if(this.formulario.value){
      this.operador = this.formulario.value.corretor;
      this.setorSelecionado = this.formulario.value.setor;
      this.telaoperador = true;
      this.filtrarSenhasPorSetor(); // Atualiza senhas após cadastro
      console.log(this.operador);   
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    this.senhaVerificar = [];
 
  
    for (let index = 0; index < this.senha.length; index++) {
       
      if (this.senha[index].operador == this.formulario.value.corretor){
         this.senhaVerificar.push(this.senha[index]);
      }
      
    }

  }*/

  
  // Registra operador convencional no sistema
  cadastrarConvencional(){
    console.log(this.formulario.value);
    
     // Verifica se o setor foi selecionado
  if (!this.formulario.value.setor) {
    alert('Por favor, selecione um setor!');
    return; // Sai do método se o setor não foi selecionado
  }
  if (!this.formulario.value.guiche) {
    alert('Por favor, selecione um guichê!');
    return; // Sai do método se o guiche não foi selecionado
  }
  if (!this.formulario.value.nome) {
    alert('Por favor, escreva seu nome!');
    return; // Sai do método se o nome não foi escrito
  } 
    
    
    if(this.formulario.value){
      this.operador = this.formulario.value.nome;
      //this.setorUsuario = this.formulario.value.setorUsuario; 
      this.setor = this.formulario.value.setor; 
      this.guiche = this.formulario.value.guiche;
      this.telaoperador = true;
      this.filtrarSenhasPorSetor();
      console.log(this.operador);
    } else {
      alert('você precisa informar nome e número do local de atendimento');
    }
    
      // Filtra as senhas do operador atual
  this.senhaVerificar = [];

    for (let index = 0; index < this.repetirSenha.length; index++) {
      
      if(this.repetirSenha[index].guiche === this.guiche) {
         this.senhaOperadorPainel = this.repetirSenha[index];
      }
      
    }
    
  
  
  }

  
  // Abre um modal para avaliar e finalizar atendimento
  /*openModal(template:TemplateRef<any>, senha:DadosSenha){
    this.modalRef = this.modalService.show(template);
    this.senhaFinalizar = senha;
    this.notasDisponiveis = Array.from({ length: 10 }, (_, i) => i); 
  }*/

  
  

  
  async finalizarConvencional(senha: DadosSenha) {
    let time = Date.now().toString();
    senha.finalatendimento = time;
    senha.status = '3';
    console.log(senha.finalatendimento);
    this.senhaFinalizar = senha;
    
    this.notaDigitada = null;
 
    // Abre o modal para que o operador insira a nota
  this.modalRef = this.modalService.show(this.modalTemplate);
 
  document.addEventListener('keydown', this.keyPressHandler);
  
 
   }
  

  // Encerrar (Função ainda não implementada)
  encerrar(senha:DadosSenha){

    

  }
      
  // Navega para a página de avaliação
/*avaliar() {
  this.router.navigate(['/avaliar']); 
}*/
mostrarSenhasNaoAtendidas() {
  console.log("Função chamada!");

  // Definir o intervalo de 5 segundos para reiniciar a função
  setInterval(() => {
    // Resetando os dados antes de fazer a nova chamada
    this.senha = [];  // Resetar a lista de senhas
    this.senhasPreferenciais = [];  // Resetar a lista de senhas preferenciais
    this.senhasNaoPreferenciais = [];  // Resetar a lista de senhas não preferenciais
    this.mostrarSenhas = false;  // Resetar a flag de exibição das senhas

    // Repetir o processo de busca e filtragem como na primeira execução
    this.adminService.getSenhasGeradas().subscribe(
      (senhas) => {
        console.log('Senhas recebidas:', senhas);
        if (!senhas || senhas.length === 0) {
          console.warn('Nenhuma senha encontrada.');
          return;
        }

        // Elimina duplicatas baseado no campo 'senha'
        const senhasUnicas = Array.from(new Set(senhas.map((s) => s.senha)))
          .map((senhaUnica) => senhas.find((s) => s.senha === senhaUnica)!);

        // Normaliza os setores (converte para minúsculas e remove espaços extras)
        const setorUsuarioNormalizado = this.setorUsuario.trim().toLowerCase();

        // Filtra as senhas de acordo com o setor (guiche)
        const senhasDoSetor = senhasUnicas.filter(s => s.setor.trim().toLowerCase() === setorUsuarioNormalizado);
        console.log('Senhas do setor:', senhasDoSetor);

        // Atribui a lista de senhas filtradas
        this.senha = senhasDoSetor; // Lista de senhas do setor
        this.senhasPreferenciais = senhasDoSetor.filter((s) => s.preferencial);
        this.senhasNaoPreferenciais = senhasDoSetor.filter((s) => !s.preferencial);

        // Para cada senha, calcular a hora com base no 'senhaid' (timestamp)
        this.senha.forEach(s => {
          // Converter o 'senhaid' (timestamp) em milissegundos para uma data
          const dataGeracao = new Date(Number(s.senhaid));
           // Obter apenas a hora, minutos e segundos
           s.horaGeracao = dataGeracao.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        });

        // Atualiza a flag para exibir as senhas
        this.mostrarSenhas = true;
      },
      (error) => {
        console.error('Erro ao buscar senhas:', error);
      }
    );
  }, 500); // 500 milissegundos = 0,5 segundo
}







/*selecionarNota(nota: number) {
  this.notaSelecionada = nota;

}*/

  // Função chamada quando o valor de ngModel muda (captura a tecla pressionada)
  onKeyPress(event: KeyboardEvent): void {
    const key = event.key;
  
    // Permite apenas números de 0 a 9
    if (key >= '0' && key <= '9') {
      this.notaDigitada = key; // Sobrescreve a nota com o número pressionado
    }
  
    // Exibe no console a nota que foi digitada até o momento
    console.log('Nota digitada:', this.notaDigitada);
    
  }
  hide() {
    document.removeEventListener('keydown', this.keyPressHandler);
  }

 // Método para finalizar a senha com nota
 async finalizarComNota(modal: BsModalRef) {
  const nota = Number(this.notaDigitada); // Converte a nota para um número
  
  // Validação para garantir que a nota está entre 0 e 10
  if (nota < 1 || nota > 10) {
    alert('Por favor, insira uma nota válida entre 1 e 10!');
    return;
  }

  this.senhaFinalizar.nota = nota; // Atribui a nota à senhaFinalizar
  const senhachamadaPath = `avelar/senhachamada/${this.senhaFinalizar.horachamada}`;

  try {
    // Salva as informações no banco de dados
    await this.adminService.salvaSenhaFinalizadaConvencional(this.senhaFinalizar);

    // Remove a senha chamada do Firebase
    await update(ref(this.db), {
      [senhachamadaPath]: null,
    });

    console.log(`Senha com finalatendimento ${this.senhaFinalizar.senhaid} apagada com sucesso no caminho: ${senhachamadaPath}`);

    alert('Atendimento finalizado com sucesso!');
    
    // Esconde os botões após finalizar o atendimento
    this.mostrarSenhas = false;
    if (this.modalRef) {
      this.modalRef.hide(); // Fecha o modal de forma segura
     
    }
    
    document.removeEventListener('keydown', this.keyPressHandler);

    // Remove a senha finalizada das listas de senhas
    this.senha = this.senha.filter(s => s.senhaid !== this.senhaFinalizar.senhaid);
    this.senhasPreferenciais = this.senhasPreferenciais.filter(s => s.senhaid !== this.senhaFinalizar.senhaid);
    this.senhasNaoPreferenciais = this.senhasNaoPreferenciais.filter(s => s.senhaid !== this.senhaFinalizar.senhaid);

  } catch (error) {
    console.error('Erro ao finalizar a senha:', error);
  }
}

// Função chamada quando o modal é aberto
/*onModalOpen(modal: any): void {
  // Adiciona um evento de captura de tecla para o modal
  document.addEventListener('keydown', this.onKeyPress.bind(this));
}

// Função chamada quando o modal é fechado
onModalClose(modal: any): void {
  // Remove o evento de captura de tecla quando o modal é fechado
  document.removeEventListener('keydown', this.onKeyPress.bind(this));
}*/

}


